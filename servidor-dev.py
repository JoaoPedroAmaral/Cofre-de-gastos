import http.server
import os
import socketserver
import sys

PORTA_PADRAO = 8000
ENDERECO = '127.0.0.1'
REQUISICOES_EM_FILA = 128

TIPOS_MIME = {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.map': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png'
}

POLITICA_SEGURANCA = (
    "default-src 'self'; script-src 'self'; style-src 'self'; "
    "img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; "
    "worker-src 'self' blob:; object-src 'none'; base-uri 'none'; "
    "form-action 'none'; frame-ancestors 'none'"
)

POLITICA_DO_SERVICE_WORKER = (
    "default-src 'self'; script-src 'self'; connect-src 'self'; "
    "object-src 'none'; base-uri 'none'"
)

CAMINHO_SERVICE_WORKER = '/sw.js'

CABECALHOS = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store'
}


class Servidor(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **TIPOS_MIME}
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Content-Security-Policy', self.politica())
        for nome, valor in CABECALHOS.items():
            self.send_header(nome, valor)
        super().end_headers()

    def politica(self):
        if self.path.split('?')[0] == CAMINHO_SERVICE_WORKER:
            return POLITICA_DO_SERVICE_WORKER
        return POLITICA_SEGURANCA


class ServidorParalelo(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = REQUISICOES_EM_FILA


def iniciar():
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else PORTA_PADRAO
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with ServidorParalelo((ENDERECO, porta), Servidor) as servidor:
        print(f'Gastos Controller em http://{ENDERECO}:{porta}')
        print(f'Testes em http://{ENDERECO}:{porta}/testes/')
        servidor.serve_forever()


if __name__ == '__main__':
    iniciar()
