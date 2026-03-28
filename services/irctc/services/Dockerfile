FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG SERVICE_NAME

# Copy common library
COPY common/ ./common/

# Copy the specific service code
COPY ${SERVICE_NAME}/ ./

ENV OTEL_SERVICE_NAME=${SERVICE_NAME}

CMD ["opentelemetry-instrument", "--traces_exporter", "otlp_proto_http", "--metrics_exporter", "none", "--logs_exporter", "none", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
