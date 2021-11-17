FROM python:3.7

# Issues experienced with ViennaRNA-2.4.14, therefore retaining 'stable' version:
ARG VIENNA_VERSION="ViennaRNA-2.4.11"

RUN curl -fsSL https://www.tbi.univie.ac.at/RNA/download/sourcecode/2_4_x/$VIENNA_VERSION.tar.gz -o /opt/$VIENNA_VERSION.tar.gz \
	&& tar zxvf /opt/$VIENNA_VERSION.tar.gz -C /opt/ \
	&& cd /opt/$VIENNA_VERSION \
	&& ./configure --without-perl --without-python --without-kinfold --without-forester --without-rnalocmin\
	&& make \
	&& make install

EXPOSE 5000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install pip requirements
COPY requirements.txt .
RUN python -m pip install -r requirements.txt

WORKDIR /app
COPY . /app

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
# CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
ENTRYPOINT [ "python" ]
CMD [ "main.py" ]