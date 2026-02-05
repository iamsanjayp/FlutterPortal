FROM ghcr.io/cirruslabs/flutter:stable

WORKDIR /app

# Disable analytics
RUN flutter config --no-analytics

# Pre-cache Flutter binaries
RUN flutter precache

# Install common fonts so Flutter uses Roboto/Noto instead of fallbacks
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		fontconfig \
		fonts-roboto \
		fonts-noto-core \
		fonts-noto-color-emoji \
	&& rm -rf /var/lib/apt/lists/* \
	&& fc-cache -f -v

# Copy the template (build context = backend folder)
# and pre-run pub get to populate the pub cache for offline/fast runs.
COPY src/execution/flutter/template_ui /tmp/template_ui
RUN if [ -d /tmp/template_ui ]; then cd /tmp/template_ui && flutter pub get || true; fi
# Ensure Roboto font assets exist inside the image template copy
RUN if [ -d /tmp/template_ui ]; then \
		mkdir -p /tmp/template_ui/fonts && \
		wget -q -O /tmp/template_ui/fonts/Roboto-Regular.ttf https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf || true && \
		wget -q -O /tmp/template_ui/fonts/Roboto-Bold.ttf https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf || true ; \
	fi

# Install any template fonts into system fonts so flutter_tester can use them
RUN if [ -d /tmp/template_ui/fonts ]; then \
    mkdir -p /usr/share/fonts/truetype/flutter && \
    cp /tmp/template_ui/fonts/*.ttf /usr/share/fonts/truetype/flutter/ || true; \
    fc-cache -f -v || true; \
  fi

# Pre-populate pub cache for google_fonts to reduce runtime network needs
RUN flutter pub cache add google_fonts || true

COPY flutter_runner/run.sh /run.sh
RUN chmod +x /run.sh

ENTRYPOINT ["/run.sh"]
