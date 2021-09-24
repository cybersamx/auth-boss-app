FROM zenika/alpine-chrome:with-puppeteer

USER root

RUN apk upgrade -U -a \
    && apk add \
    bash

USER chrome

# Copy package.json separately so that Docker can cache this step
COPY package*.json ./
RUN npm install --no-optional --production && npm cache clean --force

# Copy the test suite over
COPY . ./

# Run the test
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "test"]
