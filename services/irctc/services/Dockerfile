FROM python:3.11-slim
WORKDIR /app
ARG SERVICE_NAME

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy common library
COPY common/ ./common/

# Copy the specific service code
COPY ${SERVICE_NAME}/ ./

ENV OTEL_SERVICE_NAME=${SERVICE_NAME}

CMD ["opentelemetry-instrument", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
