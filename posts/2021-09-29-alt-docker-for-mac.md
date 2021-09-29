---
title: "Docker for Macの代替を試した結果"
date: "2021-09-29"
description: "Docker for Macの代替手段としてminikubeを使ってみた感想"
---

# TL;DR

おとなしくDocker for Macを使いましょう。

# 背景

Docker社に対してお金払いたくないわけではなく、興味本位で代替手段を試した。

# 試したもの

- minikube
  - VirtualBox
  - HyperKit

## minikubeの問題

minikubeの問題というかk8s的な問題かもしれないけど、minikube startするたびにDOCKER_HOSTのIPアドレスが変わる(可能性がある)関係で、docker compose upしたあとに適当にlocalhostで開くみたいなことができない。ただし、DriverにVirtualBoxを使うとVirtualBox側の設定でPort Fowardingができる。手動で設定することにはなるがある程度は楽になる。

## VirtualBoxの問題

DriverにVirtualBoxを使う場合、alpine系のイメージを使うとapkでパッケージのインストールをするときにDNS Lookup Errorみたいなのが出てどうしようもない。

DNS Lookup周りの不具合を再現したい場合は以下のような手順で再現できるはず。

```bash
docker run --rm -it alpine ping -c5 google.com
```

ちなみにalpine:3.12では再現せず、 alpine:3.13からこのような状態になる。

VirtualBoxのネットワーク周りの設定をいじればどうにかなる可能性もあるが時間をかけたくないので途中で諦めた。

## HyperKitの問題

docker composeなどでローカルのファイルをコンテナにマウントしようとしたが、何故か中身が空っぽになるという問題に遭遇した。

```bash
minikube start --mount --mount-string "/Users/$USER/ghq:/Users/$USER/ghq"
```

このようにminikubeの起動時にあらかじめ全部マウントしておかないといけないっぽい。

# 結論

Docker for Mac、お前だったのか。
