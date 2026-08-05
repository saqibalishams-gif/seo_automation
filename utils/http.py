import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class HTTPError(Exception):
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.exceptions.RequestException, HTTPError)),
    reraise=True
)
def request_with_retry(method: str, url: str, timeout: int = 10, **kwargs) -> requests.Response:
    """
    Wrapper for requests with exponential backoff and explicit timeout.
    No infinite hangs.
    """
    response = requests.request(method, url, timeout=timeout, **kwargs)
    response.raise_for_status()
    return response
