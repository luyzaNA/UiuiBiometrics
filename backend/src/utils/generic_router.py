"""High-performance router with path-parameter extraction."""

import re

from src.http_handlers.common import not_found
from src.http_handlers.cors import cors


class Router:
    """Optimized router using tries and regex for fast dispatch."""

    PARAM_MARKER = ":"

    def __init__(self, base_path=""):
        self.base_path = base_path.rstrip("/")
        self.static_routes = {}
        self.param_routes = {}

    def add(self, method, path, func):
        method = method.upper()
        full_path = f"{self.base_path}/{path}".replace("//", "/")
        if "{" in full_path and "}" in full_path:
            regex_parts = []
            param_names = []
            signature = []

            for segment in full_path.strip("/").split("/"):
                if segment.startswith("{") and segment.endswith("}"):
                    regex_parts.append(r"([^/]+)")
                    param_names.append(segment[1:-1])
                    signature.append(self.PARAM_MARKER)
                else:
                    regex_parts.append(re.escape(segment))
                    signature.append(segment)

            sig_key = (method, tuple(signature))
            if not hasattr(self, "_param_signatures"):
                self._param_signatures = set()
            if sig_key in self._param_signatures:
                raise ValueError(f"Duplicate parameterized route: {method} {full_path}")
            self._param_signatures.add(sig_key)

            pattern = "^/" + "/".join(regex_parts) + "$"
            compiled = re.compile(pattern)
            self.param_routes.setdefault(method, []).append(
                (compiled, param_names, func)
            )
            return

        key = (method, full_path)
        if key in self.static_routes:
            raise ValueError(f"Duplicate static route: {method} {full_path}")
        self.static_routes[key] = func

    @cors
    def dispatch(self, event, context):
        """
        Dispatch request to the matching route.

        Supports both:
        - API Gateway REST API events: event["httpMethod"], event["path"]
        - API Gateway HTTP API v2 events: event["requestContext"]["http"]["method"], event["rawPath"]
        """

        method = (
                event.get("httpMethod")
                or event.get("requestContext", {})
                .get("http", {})
                .get("method")
        )

        path = event.get("path") or event.get("rawPath")

        if not method or not path:
            return {
                "statusCode": 400,
                "body": '{"message":"Invalid event format"}',
                "headers": {
                    "Content-Type": "application/json"
                }
            }

        method = method.upper()

        static_func = self.static_routes.get((method, path))
        if static_func:
            event["pathParameters"] = {}
            return static_func(event, context)

        for compiled, param_names, func in self.param_routes.get(method, []):
            match = compiled.match(path)
            if match:
                event["pathParameters"] = dict(zip(param_names, match.groups()))
                return func(event, context)

        return not_found()