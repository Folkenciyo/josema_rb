import ipaddress

from fastapi import Request


def _is_public(address: str) -> bool:
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return ip.is_global


def caller_ip(request: Request) -> str:
    """The address of whoever sent the request, for rate limiting.

    Traefik and the Next proxy sit in front, so the original address only
    survives in X-Forwarded-For. Each proxy appends to that header, which means
    anything to the left of the real client was written by the client itself and
    can be anything. The rightmost public address is the last one a proxy of ours
    wrote: the proxies themselves live on private Docker networks.
    """
    forwarded_for = request.headers.get("x-forwarded-for", "")
    hops = [hop.strip() for hop in forwarded_for.split(",") if hop.strip()]
    for hop in reversed(hops):
        if _is_public(hop):
            return hop
    return request.client.host if request.client else "unknown"
