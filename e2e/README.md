# Authx End-to-End Tests

End-to-end tests for testing the Authx web pages.

## Setup

Run the tests locally.

1. Install packages.

   ```bash
   $ npm install
   ```

1. Run the tests.

   ```bash
   $ # Run the tests in headless mode.
   $ npm test
   $ # Run the tests visually on web browser.
   $ AX_E2E_DEBUG=1 npm test
   ```

Run the tests in Docker - great for CI and running it in the Cloud.

1. Build the Docker image.

   ```bash
   $ docker-compose build
   ```

1. Run the Docker image.

   ```bash
   $ docker-compose up
   ```
