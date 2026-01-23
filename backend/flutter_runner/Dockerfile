FROM ghcr.io/cirruslabs/flutter:stable

WORKDIR /app

# Disable analytics
RUN flutter config --no-analytics

# Pre-cache Flutter binaries
RUN flutter precache

COPY run.sh /run.sh
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]
