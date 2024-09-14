import { InscriptionResult, Network, WalletProvider } from '../wallet_provider'
import { parseUnits } from '../utils/parseUnits'
import { getAddressBalance } from '../mempool_api'

const INTERNAL_NETWORK_NAMES = {
  [Network.MAINNET]: 'livenet',
  [Network.TESTNET]: 'testnet',
  [Network.SIGNET]: 'signet'
}

// window object for Bitget Wallet extension
export const bitgetWalletProvider = 'bitkeep'

export class BitgetWallet extends WalletProvider {
  private bitcoinNetworkProvider: any
  private networkEnv: Network | undefined

  constructor() {
    super()

    // check whether there is an Bitget Wallet extension
    if (!window[bitgetWalletProvider]?.unisat) {
      throw new Error('Bitget Wallet extension not found')
    }

    this.bitcoinNetworkProvider = window[bitgetWalletProvider].unisat
  }

  connectWallet = async (): Promise<any> => {
    try {
      await this.bitcoinNetworkProvider.requestAccounts() // Connect to Bitget Wallet extension
    } catch (error) {
      if ((error as Error)?.message?.includes('rejected')) {
        throw new Error('Connection to Bitget Wallet was rejected')
      } else {
        throw new Error((error as Error)?.message)
      }
    }

    const address = await this.getAddress()
    const publicKeyHex = await this.getPublicKeyHex()

    if (!address || !publicKeyHex) {
      throw new Error('Could not connect to Bitget Wallet')
    }
    return this
  }

  getWalletProviderName = async (): Promise<string> => {
    return 'Bitget Wallet'
  }

  getAddress = async (): Promise<string> => {
    const accounts = (await this.bitcoinNetworkProvider.getAccounts()) || []
    if (!accounts?.[0]) {
      throw new Error('Bitget Wallet not connected')
    }
    return accounts[0]
  }

  getPublicKeyHex = async (): Promise<string> => {
    const publicKey = await this.bitcoinNetworkProvider.getPublicKey()
    if (!publicKey) {
      throw new Error('Bitget Wallet not connected')
    }
    return publicKey
  }

  signPsbt = async (psbtHex: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.signPsbt(psbtHex)
  }

  signPsbts = async (psbtsHexes: string[]): Promise<string[]> => {
    if (!psbtsHexes && !Array.isArray(psbtsHexes)) {
      throw new Error('params error')
    }
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes)
  }

  signMessageBIP322 = async (message: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.signMessage(
      message,
      'bip322-simple'
    )
  }

  getNetwork = async (): Promise<Network> => {
    const internalNetwork = await this.bitcoinNetworkProvider.getNetwork()

    for (const [key, value] of Object.entries(INTERNAL_NETWORK_NAMES)) {
      if (value === internalNetwork) {
        return key as Network
      }
    }

    throw new Error('Unsupported network')
  }

  on = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.on(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.off(eventName, callBack)
  }

  getBalance = async (): Promise<number> => {
    return await getAddressBalance(
      await this.getNetwork(),
      await this.getAddress()
    )
  }

  pushTx = async (txHex: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      INTERNAL_NETWORK_NAMES[network]
    )
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(
      to,
      Number(parseUnits(satAmount.toString(), 8))
    )
    return result
  }
  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    return await this.bitcoinNetworkProvider.getInscriptions(cursor, size)
  }
}
