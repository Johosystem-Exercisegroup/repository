from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

# カスタム例外ハンドラー
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# データベース関連の例外
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Database integrity error: a unique constraint or foreign key failed."},
    )

async def operational_error_handler(request: Request, exc: OperationalError):
    import traceback
    print(f"OperationalError: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Database operational error: {str(exc)}"},
    )

# 予期しない例外をキャッチ
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )
