from app import app

def function(environ, start_response):
    return app(environ, start_response)