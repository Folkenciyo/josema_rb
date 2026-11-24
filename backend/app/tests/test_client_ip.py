from starlette.requests import Request

from app.core.client_ip import caller_ip


def _request(forwarded_for: str | None, peer: str = "172.18.0.3") -> Request:
    headers = []
    if forwarded_for is not None:
        headers.append((b"x-forwarded-for", forwarded_for.encode()))
    return Request(
        {"type": "http", "headers": headers, "client": (peer, 1234)},
    )


def test_without_header_uses_the_peer() -> None:
    assert caller_ip(_request(None, peer="127.0.0.1")) == "127.0.0.1"


def test_takes_the_rightmost_public_address() -> None:
    request = _request("6.6.6.6, 81.40.1.2, 172.18.0.5")

    assert caller_ip(request) == "81.40.1.2"


def test_a_forged_first_hop_is_ignored() -> None:
    first = caller_ip(_request("1.1.1.1, 81.40.1.2"))
    second = caller_ip(_request("2.2.2.2, 81.40.1.2"))

    assert first == second == "81.40.1.2"


def test_only_private_hops_fall_back_to_the_peer() -> None:
    request = _request("10.0.0.4, 172.18.0.5", peer="172.18.0.9")

    assert caller_ip(request) == "172.18.0.9"


def test_garbage_in_the_header_is_skipped() -> None:
    assert caller_ip(_request("not-an-ip, 81.40.1.2")) == "81.40.1.2"
