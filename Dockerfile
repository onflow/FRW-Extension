FROM debian:latest

RUN mkdir /app
WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . .

RUN apt-get update && apt-get install -y curl grep mlocate

RUN sh -ci "$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)"
RUN mv e2e-flow.json flow.json


ENTRYPOINT [ "/entrypoint.sh" ]
