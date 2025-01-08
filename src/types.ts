import { WalletProvider } from './WalletProvider'

export type TomoWalletType = 'extension' | 'qrcode' | 'injected'

export type TomoWallet = {
  id: string
  img: string
  name: string
  chainType: string
  connectProvider?: typeof WalletProvider
  type: TomoWalletType
}
