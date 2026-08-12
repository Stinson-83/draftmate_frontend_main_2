FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port 8015
EXPOSE 8015

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8015"]
