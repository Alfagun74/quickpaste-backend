# Quickpaste-Server
Typescript NodeJS Backend for Quickpaste.   
A Tool to quickly share images with your friends or colleagues.

### Prerequisities
In order to run this container you'll need docker installed.

-   [Windows](https://docs.docker.com/windows/started)
-   [OS X](https://docs.docker.com/mac/started/)
-   [Linux](https://docs.docker.com/linux/started/)
  
You will also have to Setup a MongoDB.

#### Container Parameters
Run the Container

```shell
docker run quickpaste:latest
```

Shell into Container

```shell
docker run quickpaste:latest /bin/sh
```

#### Environment Variables
-   `DB_HOST` - MongoDB Address and Port (for example `mongodb://srv-captain--quickpaste-db:27017`)
-   `DB_NAME` - MongoDB Database Name (for example `quickpaste`)
-   `DB_USER` - MongoDB Username (for example `quickpaste`)
-   `DB_PASS` - MongoDB Password (for example `quickpaste`)
-   `PORT` - HTTP Server Port (default: `80`)

#### Volumes
-   `/usr/src/app/uploads` - Uploaded Compressed Images location

#### Useful File Locations
-   `/usr/src/app/full-uploads` - Uploaded Full Images location (Should get deleted after compression)

## Built With
-   NodeJS
-   Typescript
-   Express
-   Socket.io
-   Mongoose
-   Imagemin

## Find Us
-   [Gitea](https://gitea.platform.alfagun74.de/Sunnybox)

## Versioning
We use [SemVer](http://semver.org/) for versioning. Husky counts the minor up in his pre-commit-hook For the versions available, see the
[tags on this repository](https://github.com/your/repository/tags).

## Authors
-   **Alfagun74 (Alper Alkan)** - Lead - [Alfagun74](https://github.com/Alfagun74)

## License
This project is explicitly unlicensed. You can not use it under any terms or conditions. All rights reserved.