FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY ml_assets/ ${LAMBDA_TASK_ROOT}/ml_assets/

WORKDIR ${LAMBDA_TASK_ROOT}