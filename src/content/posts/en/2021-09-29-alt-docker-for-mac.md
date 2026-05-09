---
slug: "2021-09-29-alt-docker-for-mac"
locale: "en"
title: "Results of Trying Alternatives to Docker for Mac"
publishedAt: "2021-09-29T00:00:00.000Z"
updatedAt: "2026-05-08T19:40:40.179Z"
draft: false
tags: []
seo:
  title: "Results of Trying Alternatives to Docker for Mac"
  description: "My thoughts after trying to use minikube as an alternative to Docker for Mac."
translation:
  disabled: false
  sourceLocale: "ja"
  sourceSlug: "2021-09-29-alt-docker-for-mac"
  sourceVersion: "017203e1d355b30e86028fcbc0570eb419ca9f616e6f54e3c99e5e31250aa260"
generation:
  sourceHash: "2a35d4337134a0a5ddcc37e685461f9358fd845493fe1f0985d43240503c4520"
  status: "published"
---

## TL;DR

Just stick with Docker for Mac.

## Background

It's not that I don't want to pay Docker, Inc.; I just tried out alternatives out of curiosity.

## What I Tested

- minikube
  - VirtualBox
  - HyperKit

### Issues with minikube

It might be more of a K8s issue than a minikube problem specifically, but because the DOCKER_HOST IP address can change every time you run `minikube start`, you can't simply open `localhost` immediately after running `docker compose up`. That said, if you use VirtualBox as the driver, you can configure port forwarding in the VirtualBox settings. It requires manual setup, but it makes things a bit easier.

### Issues with VirtualBox

When using VirtualBox as the driver, if you use alpine-based images, you hit an unavoidable "DNS Lookup Error" when trying to install packages via `apk`.

If you want to reproduce this issue with DNS lookups, you should be able to do so with the following command:

```bash
docker run --rm -it alpine ping -c5 google.com
```

For the record, this does not occur in `alpine:3.12`, but starts happening from `alpine:3.13` onwards.

There's a possibility it could be resolved by fiddling with the VirtualBox network settings, but I didn't want to spend the time, so I gave up halfway through.

### Issues with HyperKit

I tried mounting local files to containers using `docker compose` and similar tools, but experienced an issue where the contents appeared empty for some reason.

```bash
minikube start --mount --mount-string "/Users/$USER/ghq:/Users/$USER/ghq"
```

It seems you have to pre-mount everything when launching minikube like this.

## Conclusion

Docker for Mac, was it you all along?
