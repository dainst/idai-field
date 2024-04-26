FROM debian:bullseye-20230703


# Update packages and install tools
RUN apt-get update -qy && apt-get dist-upgrade -qy && \
    apt-get install -qy --no-install-recommends curl imagemagick \
    libopenjp2-tools ffmpeg unzip default-jre-headless && \
    apt-get -qqy autoremove && apt-get -qqy autoclean

# Run non privileged
RUN adduser --system cantaloupe

ENV CANTALOUPE_VERSION=5.0.5

# Get and unpack Cantaloupe release archive
RUN curl --silent --fail -OL https://github.com/medusa-project/cantaloupe/releases/download/v$CANTALOUPE_VERSION/Cantaloupe-$CANTALOUPE_VERSION.zip \
    && unzip Cantaloupe-$CANTALOUPE_VERSION.zip \
    && ln -s cantaloupe-$CANTALOUPE_VERSION cantaloupe \
    && rm Cantaloupe-$CANTALOUPE_VERSION.zip \
    && mkdir -p /var/log/cantaloupe /var/cache/cantaloupe \
    && chown -R cantaloupe /cantaloupe-$CANTALOUPE_VERSION /var/log/cantaloupe /var/cache/cantaloupe \
    && cp -rs /cantaloupe/deps/Linux-x86-64/* /usr/

COPY ./cantaloupe.properties /cantaloupe/cantaloupe.properties

RUN sed -i 's#FilesystemSource.BasicLookupStrategy.path_prefix = /home/myself/images/#FilesystemSource.BasicLookupStrategy.path_prefix = /image_root/#' /cantaloupe/cantaloupe.properties
RUN sed -i 's#log.application.level = debug#log.application.level = info#' /cantaloupe/cantaloupe.properties

COPY imagemagick-policy.xml /usr/share/ImageMagick-6/policy.xml

RUN mkdir /image_root
RUN mkdir /source_images

RUN chown cantaloupe /image_root

VOLUME /image_root

USER cantaloupe

EXPOSE 8182

CMD ["sh", "-c", "java -Dcantaloupe.config=/cantaloupe/cantaloupe.properties -jar /cantaloupe/cantaloupe-$CANTALOUPE_VERSION.jar"]