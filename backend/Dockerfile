FROM python:3.13.7-slim
WORKDIR /backend

ENV UV_PROJECT_ENVIRONMENT=/opt/venv
RUN pip install uv
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen

COPY . .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
