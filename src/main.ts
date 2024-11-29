import okxIcon from './icons/okx_wallet.svg'
import unisatIcon from './icons/unisat_wallet.svg'
import tomoIcon from './icons/tomo.png'
import bitgetIcon from './icons/bitget-wallet.png'
import onekeyIcon from './icons/onekey.svg'
import imtokenIcon from './icons/imtoken.svg'
import keystoneIcon from './icons/keystone.svg'
import keplrIcon from './icons/keplr_wallet.png'
import binanceIcon from './icons/binance.webp'
import cosmostationIcon from './icons/cosmostation.ico'
import stationIcon from './icons/station.svg'
import leapIcon from './icons/leap.jpg'
import cactuslinkIcon from './icons/cactuslink.svg'
import { OKXBTCWallet } from './providers/btc/OKXBTCWallet'
import { UniSatBTCWallet } from './providers/btc/UniSatBTCWallet'
import { TomoBTCWallet } from './providers/btc/TomoBTCWallet'
import { BitgetBTCWallet } from './providers/btc/BitgetBTCWallet'
import { OneKeyBTCWallet } from './providers/btc/OneKeyBTCWallet'
import { ImTokenBTCWallet } from './providers/btc/ImTokenBTCWallet'
import { KeystoneWallet } from './providers/btc/keystone'
import { BinanceBTCWallet } from './providers/btc/BinanceBTCWallet'
import { WalletProvider } from './WalletProvider'
import { KeplrCosmosWallet } from './providers/cosmos/KeplrCosmosWallet'
import { OKXCosmosWallet } from './providers/cosmos/OKXCosmosWallet'
import { CosmostationCosmosWallet } from './providers/cosmos/CosmostationCosmosWallet'
import { LeapCosmosWallet } from './providers/cosmos/LeapCosmosWallet'
import { BitgetCosmosWallet } from './providers/cosmos/BitgetCosmosWallet'
import { OneKeyCosmosWallet } from './providers/cosmos/OneKeyCosmosWallet'
import { StationCosmosWallet } from './providers/cosmos/StationCosmosWallet'
import { CactusLinkBTCWallet } from './providers/btc/CactusLinkBTCWallet'
import { LeapBTCWallet } from 'providers/btc/LeapBTCWallet'

type TomoWalletType = 'extension' | 'qrcode' | 'injected'

type TomoWallet = {
  id: string
  img: string
  name: string
  chainType: string
  connectProvider?: typeof WalletProvider
  type: TomoWalletType
}

// Special case for the browser wallet. i.e injected wallet

export const walletList: TomoWallet[] = [
  {
    id: 'bitcoin_leap',
    img: leapIcon,
    name: 'Leap',
    chainType: 'bitcoin',
    connectProvider: LeapBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_okx',
    img: okxIcon,
    name: 'OKX',
    chainType: 'bitcoin',
    connectProvider: OKXBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_unisat',
    img: unisatIcon,
    name: 'Unisat',
    chainType: 'bitcoin',
    connectProvider: UniSatBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_tomo',
    img: tomoIcon,
    name: 'Tomo',
    chainType: 'bitcoin',
    connectProvider: TomoBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_onekey',
    img: onekeyIcon,
    name: 'OneKey',
    chainType: 'bitcoin',
    connectProvider: OneKeyBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_bitget',
    img: bitgetIcon,
    name: 'Bitget',
    chainType: 'bitcoin',
    connectProvider: BitgetBTCWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_cactuslink',
    img: cactuslinkIcon,
    name: 'Cactus Link',
    chainType: 'bitcoin',
    connectProvider: CactusLinkBTCWallet,
    type: 'extension'
  },
  {
    id: 'cosmos_keplr',
    img: keplrIcon,
    name: 'Keplr',
    chainType: 'cosmos',
    connectProvider: KeplrCosmosWallet,
    type: 'extension'
  },
  {
    id: 'cosmos_okx',
    img: okxIcon,
    name: 'OKX',
    chainType: 'cosmos',
    connectProvider: OKXCosmosWallet,
    type: 'extension'
  },
  {
    id: 'cosmos_cosmostation',
    img: cosmostationIcon,
    name: 'Cosmostation',
    chainType: 'cosmos',
    connectProvider: CosmostationCosmosWallet,
    type: 'extension'
  },
  {
    id: 'cosmos_leap',
    img: leapIcon,
    name: 'Leap',
    chainType: 'cosmos',
    connectProvider: LeapCosmosWallet,
    type: 'extension'
  },
  // {
  //   id: 'cosmos_bitget',
  //   img: bitgetIcon,
  //   name: 'Bitget',
  //   chainType: 'cosmos',
  //   connectProvider: BitgetCosmosWallet,
  //   type: 'extension'
  // },
  {
    id: 'cosmos_onekey',
    img: onekeyIcon,
    name: 'OneKey',
    chainType: 'cosmos',
    connectProvider: OneKeyCosmosWallet,
    type: 'extension'
  },
  {
    id: 'cosmos_station',
    img: stationIcon,
    name: 'Station',
    chainType: 'cosmos',
    connectProvider: StationCosmosWallet,
    type: 'extension'
  },
  {
    id: 'bitcoin_imtoken',
    img: imtokenIcon,
    name: 'imToken',
    chainType: 'bitcoin',
    connectProvider: ImTokenBTCWallet,
    type: 'injected'
  },
  {
    id: 'bitcoin_binance',
    img: binanceIcon,
    name: 'Binance',
    chainType: 'bitcoin',
    connectProvider: BinanceBTCWallet,
    type: 'injected'
  },
  {
    id: 'bitcoin_keystone',
    img: keystoneIcon,
    name: 'Keystone',
    chainType: 'bitcoin',
    connectProvider: KeystoneWallet,
    type: 'qrcode'
  }
]

export * from './WalletProvider'
export * from './utils/parseUnits'

export * from './providers/btc/BTCProvider'
export * from './providers/cosmos/CosmosProvider'
