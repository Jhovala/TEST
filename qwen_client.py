"""
Cliente de ejemplo para Qwen3-Coder con control de tasa (rate limiting),
reintentos con backoff exponencial + jitter, y lectura del header Retry-After.

El error que ves:
    "Request rate increased too quickly. To ensure system stability,
     please adjust your client logic to scale requests more smoothly over time."
significa que el servidor detecta un *aumento brusco* de peticiones (no solo
un limite por minuto). La solucion es enviar las peticiones de forma suave y
constante, no en rafagas.

Dependencias: pip install openai tenacity  (tenacity ya esta disponible aqui)
"""

from __future__ import annotations

import random
import threading
import time
from collections import deque

from openai import OpenAI, RateLimitError, APIStatusError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
    before_sleep_log,
)

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qwen-client")


# ---------------------------------------------------------------------------
# 1) Limitador de velocidad "smooth": autoriza una peticion cada intervalo fijo
# ---------------------------------------------------------------------------
class SmoothRateLimiter:
    """
    Espacia las peticiones de forma uniforme (policia de balde con refill
    continuo). Evita los picos que provocan el error "rate increased too quickly".

    Uso:
        limiter = SmoothRateLimiter(requests_per_second=2)   # max 2 rps sostenidas
        limiter.acquire()   # bloquea hasta que sea seguro lanzar la peticion
    """

    def __init__(self, requests_per_second: float, burst: int = 1):
        self.rate = max(float(requests_per_second), 1e-9)
        self.capacity = max(int(burst), 1)          # tolerancia pequena a rafagas
        self.tokens = float(self.capacity)
        self.updated = time.monotonic()
        self._lock = threading.Lock()

    def acquire(self) -> None:
        while True:
            with self._lock:
                now = time.monotonic()
                self.tokens = min(
                    self.capacity, self.tokens + (now - self.updated) * self.rate
                )
                self.updated = now
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                wait = (1 - self.tokens) / self.rate
            time.sleep(wait)


# ---------------------------------------------------------------------------
# 2) Reintentos con espera inteligente (respeta Retry-After si viene en el header)
# ---------------------------------------------------------------------------
def _wait_from_response(err: BaseException) -> float | None:
    """Extrae Retry-After (segundos) de la respuesta del proveedor, si existe."""
    resp = getattr(err, "response", None)
    if resp is not None:
        ra = resp.headers.get("retry-after") or resp.headers.get("x-ratelimit-reset-requests")
        if ra is not None:
            try:
                return max(float(ra), 0.5)
            except ValueError:
                pass
    return None


@retry(
    retry=retry_if_exception_type((RateLimitError, APIStatusError)),
    wait=wait_random_exponential(multiplier=1, max=60),  # 1s, 2s, 4s... + jitter
    stop=stop_after_attempt(6),
    before_sleep=before_sleep_log(logger, logging.WARNING),
)
def _call_with_retry(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except RateLimitError as e:
        ra = _wait_from_response(e)
        if ra:                      # si el servidor dice cuando volver, obedecer
            time.sleep(ra)
        raise


# ---------------------------------------------------------------------------
# 3) Cliente listo para usar
# ---------------------------------------------------------------------------
class QwenClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        model: str = "qwen3-coder-plus",
        requests_per_second: float = 2.0,
    ):
        self.client = OpenAI(
            api_key=api_key or "sk-...",   # o deja OPENAI_API_KEY en el entorno
            base_url=base_url,
        )
        self.model = model
        self.limiter = SmoothRateLimiter(requests_per_second=requests_per_second, burst=2)

    def chat(self, messages, **kwargs):
        self.limiter.acquire()      # <-- clave: suaviza el trafico antes de llamar
        return _call_with_retry(
            self.client.chat.completions.create,
            model=self.model,
            messages=messages,
            **kwargs,
        )


# ---------------------------------------------------------------------------
# 4) Variante SIN dependencias: solo `requests` (o incluso urllib)
# ---------------------------------------------------------------------------
def chat_requests(api_key: str,
                  messages,
                  model: str = "qwen3-coder-plus",
                  base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                  max_retries: int = 6):
    """Llamada simple con requests: sleep suave entre peticiones + backoff en 429."""
    import requests

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    for attempt in range(max_retries):
        r = requests.post(f"{base_url}/chat/completions",
                          json={"model": model, "messages": messages},
                          headers=headers, timeout=60)
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"]
        if r.status_code == 429 or r.status_code >= 500:
            wait = float(r.headers.get("Retry-After", 0)) or min(2 ** attempt + random.uniform(0, 1), 60)
            logger.warning("HTTP %s -> reintento en %.1fs", r.status_code, wait)
            time.sleep(wait)
            continue
        r.raise_for_status()
    raise RuntimeError(f"Agotados {max_retries} reintentos")


# ---------------------------------------------------------------------------
# 5) Variante asyncio: semaphore + spacing (para llamadas concurrentes suaves)
# ---------------------------------------------------------------------------
async def chat_async_many(client: "QwenClient", prompts, concurrency: int = 4, delay: float = 0.5):
    """
    Lanza N prompts en paralelo pero controlado:
      - semaphore limita el numero de llamadas simultaneas
      - asyncio.sleep entre envios evita la rafaga inicial
    """
    import asyncio

    sem = asyncio.Semaphore(concurrency)

    async def one(i, prompt):
        async with sem:
            await asyncio.sleep(i * delay)          # escalonamiento "smooth"
            loop = asyncio.get_running_loop()
            out = await loop.run_in_executor(
                None, lambda: client.chat([{"role": "user", "content": prompt}])
            )
            return out.choices[0].message.content

    return await asyncio.gather(*(one(i, p) for i, p in enumerate(prompts)))


# ---------------------------------------------------------------------------
# 6) Variante LangChain: rate_limit + max_retries ya integrados
# ---------------------------------------------------------------------------
def make_langchain_llm(api_key: str, model: str = "qwen3-coder-plus",
                       rpm: int = 100, tpm: int = 80_000):
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        rate_limit_requests=rpm,      # LangChain aplica su propio bucket
        rate_limit_tokens=tpm,
        max_retries=5,                # reintentos con backoff incluidos
    )


if __name__ == "__main__":
    qwen = QwenClient(requests_per_second=1.0)

    prompts = [f"Cuenta {i}" for i in range(5)]
    for p in prompts:
        try:
            out = qwen.chat([{"role": "user", "content": f"Di solo el numero: {p}"}])
            print(p, "->", out.choices[0].message.content)
        except Exception as e:
            print("Fallo definitivo:", type(e).__name__, e)
