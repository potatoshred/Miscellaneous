import axios from 'axios';
const $axios = axios.create({})

const randomSleep = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  console.log(`Sleeping for ${delay} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, delay * 1000))
}

const getTokenConfig = async () => {
  const genshinTokens = process.env.GENSHIN_TOKENS
  const StarRailTokens = process.env.STARRAIL_TOKENS
  if (!genshinTokens && !StarRailTokens) {
    console.error("Missing required environment variables.");
    return { CloudYS: [], CloudSR: [] }
  }
  const genshinTokenArr = genshinTokens ? genshinTokens.split(',') : []
  const StarRailTokenArr = StarRailTokens ? StarRailTokens.split(',') : []
  return { CloudYS: genshinTokenArr, CloudSR: StarRailTokenArr }
}

const commonHeaders = {
  Connection: "Keep-Alive",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "accept-language": "zh-CN,zh;q=0.9",
  Accept: "application/json, text/plain, */*",
  "sec-ch-ua": `"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"`,
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": `"macOS"`,
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "x-rpc-channel": "mihoyo",
  "x-rpc-client_type": 17,
  "x-rpc-combo_token": "",
  "x-rpc-cps": "mac_mihoyo",
  "x-rpc-device_id": "1b252815-b2df-494f-8c84-a93e1a6d3479",
  "x-rpc-device_model": "Macintosh",
  "x-rpc-device_name": "Apple Macintosh",
  "x-rpc-language": "zh-cn",
  "x-rpc-sys_version": "Mac OS 10.15.7",
  "x-rpc-vendor_id": 2,
}
const gameConfig = {
  CloudYS: {
    headers: {
      Host: "api-cloudgame.mihoyo.com",
      origin: "https://ys.mihoyo.com",
      Referer: "https://ys.mihoyo.com/",
      "x-rpc-app_id": 4,
      "x-rpc-app_version": "6.0.0",
      "x-rpc-cg_game_biz": "hk4e_cn",
      "x-rpc-op_biz": "clgm_cn",
    },
    baseURL: "https://api-cloudgame.mihoyo.com/hk4e_cg_cn",
  },
  CloudSR: {
    headers: {
      Host: "cg-hkrpg-api.mihoyo.com",
      origin: "https://sr.mihoyo.com",
      Referer: "https://sr.mihoyo.com/",
      "x-rpc-app_id": 8,
      "x-rpc-app_version": "3.5.0",
      "x-rpc-cg_game_biz": "hkrpg_cn",
      "x-rpc-op_biz": "clgm_hkrpg-cn",
    },
    baseURL: "https://cg-hkrpg-api.mihoyo.com/hkrpg_cn/cg",
  }
}

const getWallet = async (gameKey, token) => {
  const config = gameConfig[gameKey]
  const res = await $axios.request({
    method: 'GET',
    headers: { ...commonHeaders, ...config.headers, "x-rpc-combo_token": token },
    url: config.baseURL + '/wallet/wallet/get'
  }).catch(err => { console.error(`[${gameKey}] Get wallet error\n` + err) })
  if ((res?.data?.message === 'OK') && res.data.data.free_time) {
    console.log(`[${gameKey}] Get wallet success! free time: ${res.data.data.free_time.free_time}, total_time: ${res.data.data.total_time}`)
  } else {
    console.error(`[${gameKey}] Get wallet error\n` + res)
  }
}

const getNotifications = async (gameKey, token) => {
  const config = gameConfig[gameKey]
  const res = await $axios.request({
    method: 'GET',
    headers: { ...commonHeaders, ...config.headers, "x-rpc-combo_token": token },
    url: config.baseURL + '/gamer/api/listNotifications?status=NotificationStatusUnread&type=NotificationTypePopup&is_sort=true'
  }).catch(err => { console.error(`[${gameKey}] Get notifications error\n` + err) })
  if ((res?.data?.message === 'OK') && res.data.data.list) {
    console.log(`[${gameKey}] Get notifications success!`,)
    return res.data.data.list
  } else {
    console.error(`[${gameKey}] Get notifications error\n` + res)
    return []
  }
}

const ackNotifications = async (gameKey, token, id) => {
  const config = gameConfig[gameKey]
  const res = await $axios.request({
    method: 'POST',
    headers: { ...commonHeaders, ...config.headers, "x-rpc-combo_token": token },
    url: config.baseURL + '/gamer/api/ackNotification',
    data: { id }
  }).catch(err => { console.error(`[${gameKey}] ACK notifications error\n` + err) })
  if (res?.data?.message === 'OK') {
    console.log(`[${gameKey}] ACK notifications success!`,)
  } else {
    console.error(`[${gameKey}] ACK notifications error\n` + res)
  }
}

const doCloudSign = async (gameKey) => {
  const CONF = await getTokenConfig()
  const tokenList = CONF[gameKey]
  if (tokenList.length) {
    console.info(`[${gameKey}] Start signing in, total ${tokenList.length} users\n`)
    for (const tokenIndex in tokenList) {
      const token = tokenList[tokenIndex]
      if (token) {
        console.log(`[${gameKey}] User ${Number(tokenIndex) + 1} starts signing in...`)
        await getWallet(gameKey, token)
        const notificationsList  = await getNotifications(gameKey, token)
        console.log(`[${gameKey}] Retrieved notifications:`, JSON.stringify(notificationsList))
        if (notificationsList?.length) {
          for (const notification of notificationsList) {
            await randomSleep(1, 3)
            await ackNotifications(gameKey, token, notification.id)
          }
          await getWallet(gameKey, token)
        }
        await randomSleep(3, 9)
      }
    }
  }
  console.info(`[${gameKey}] Sign-in completed\n`)
}

export { doCloudSign }
