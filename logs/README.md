# Logs

Build and test logs for local development.

- `make-install.log` - output of `make install` (nodeenv setup, deps, webpack build, wheel install)
- `jest.log` - output of the jest unit test run (`jlpm test`)
- `ui-tests.log` - output of the Galata/Playwright UI test run
- `dev-build.log` - output of a local rebuild + force-reinstall used to verify a fix without bumping the version
