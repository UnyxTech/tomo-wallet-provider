import { okxBTCWalletOption } from './providers/btc/OKXBTCWallet'
import { uniSatBTCWalletOption } from './providers/btc/UniSatBTCWallet'
import { tomoBTCWalletOption } from './providers/btc/TomoBTCWallet'
import { bitgetBTCWalletOption } from './providers/btc/BitgetBTCWallet'
import { oneKeyBTCWalletOption } from './providers/btc/OneKeyBTCWallet'
import { imTokenBTCWalletOption } from './providers/btc/ImTokenBTCWallet'
import { keystoneBTCWalletOption } from './providers/btc/keystone'
import { binanceBTCWalletOption } from './providers/btc/BinanceBTCWallet'
import { keplrCosmosWalletOption } from './providers/cosmos/KeplrCosmosWallet'
import { okxCosmosWalletOption } from './providers/cosmos/OKXCosmosWallet'
import { cosmostationCosmosWalletOption } from './providers/cosmos/CosmostationCosmosWallet'
import { leapCosmosWalletOption } from './providers/cosmos/LeapCosmosWallet'
import { oneKeyCosmosWalletOption } from './providers/cosmos/OneKeyCosmosWallet'
import { stationCosmosWalletOption } from './providers/cosmos/StationCosmosWallet'
import { cactusLinkBTCWalletOption } from './providers/btc/CactusLinkBTCWallet'
import { leapBtcWalletOptions } from './providers/btc/LeapBTCWallet'
import { TomoWallet } from './types'
import { cosmostationBTCWalletOption } from 'providers/btc/CosmostationBTCWallet'
import { bitgetCosmosWalletOption } from './providers/cosmos/BitgetCosmosWallet'
import { uniSatCosmosWalletOption } from './providers/cosmos/UniSatCosmosWallet'
import { xverseBTCWalletOption } from 'providers/btc/XverseBTCWallet'
import { keplrBTCWalletOption } from 'providers/btc/KeplrBTCWallet'
import { keystoneCosmosWalletOption } from 'providers/cosmos/keystone'
import { tomoCosmosWalletOption } from 'providers/cosmos/TomoCosmosWallet'
import { cactusLinkCosmosWalletOption } from 'providers/cosmos/CactusLinkCosmosWallet'

// Special case for the browser wallet. i.e injected wallet

export {
  okxBTCWalletOption,
  bitgetBTCWalletOption,
  uniSatBTCWalletOption,
  tomoBTCWalletOption,
  oneKeyBTCWalletOption,
  cactusLinkBTCWalletOption,
  cactusLinkCosmosWalletOption,
  imTokenBTCWalletOption,
  binanceBTCWalletOption,
  keystoneBTCWalletOption,
  keplrCosmosWalletOption,
  keplrBTCWalletOption,
  okxCosmosWalletOption,
  cosmostationCosmosWalletOption,
  leapCosmosWalletOption,
  oneKeyCosmosWalletOption,
  stationCosmosWalletOption,
  leapBtcWalletOptions,
  cosmostationBTCWalletOption,
  xverseBTCWalletOption,
  keystoneCosmosWalletOption,
  tomoCosmosWalletOption
}

export const btcWalletList: TomoWallet[] = [
  okxBTCWalletOption,
  bitgetBTCWalletOption,
  uniSatBTCWalletOption,
  tomoBTCWalletOption,
  oneKeyBTCWalletOption,
  cactusLinkBTCWalletOption,
  imTokenBTCWalletOption,
  binanceBTCWalletOption,
  keystoneBTCWalletOption,
  leapBtcWalletOptions,
  cosmostationBTCWalletOption,
  xverseBTCWalletOption,
  keplrBTCWalletOption
]
export const cosmosWalletList = [
  keplrCosmosWalletOption,
  okxCosmosWalletOption,
  bitgetCosmosWalletOption,
  uniSatCosmosWalletOption,
  tomoCosmosWalletOption,
  cosmostationCosmosWalletOption,
  leapCosmosWalletOption,
  oneKeyCosmosWalletOption,
  stationCosmosWalletOption,
  keystoneCosmosWalletOption,
  cactusLinkCosmosWalletOption,
]

export * from './WalletProvider'
export * from './utils/parseUnits'

export * from './providers/btc/BTCProvider'
export * from './providers/cosmos/CosmosProvider'
