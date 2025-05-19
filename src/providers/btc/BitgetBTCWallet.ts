import {
  getWindow,
  InscriptionResult,
  Network,
  ProviderOption
} from '../../WalletProvider'
import { Psbt } from 'bitcoinjs-lib'
import { BTCProvider, SignPsbtOptions } from './BTCProvider'
import bitgetIcon from '../../icons/bitget-wallet.png'
import { TomoWallet } from '../../types'

const INTERNAL_NETWORK_NAMES = {
  [Network.MAINNET]: 'livenet',
  [Network.TESTNET]: 'testnet',
  [Network.SIGNET]: 'signet'
}

// window object for Bitget Wallet extension
export const bitgetWalletProvider = 'bitkeep'

export class BitgetBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    const bitcoinNetworkProvider =
      // @ts-ignore
      getWindow(option)[bitgetWalletProvider]?.unisat
    if (!bitcoinNetworkProvider) {
      throw new Error('Bitget Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
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

  signPsbt = async (
    psbtHex: string,
    options?: SignPsbtOptions
  ): Promise<string> => {
    const data = {
      method: 'signPsbt',
      params: {
        // @ts-ignore
        from: this.bitcoinNetworkProvider.selectedAddress,
        __internalFunc: '__signPsbt_babylon',
        psbtHex,
        options: options || {
          autoFinalized: true
        }
      }
    }
    // @ts-ignore
    const signedPsbt = await this.bitcoinNetworkProvider.request(
      'dappsSign',
      data
    )
    const psbt = Psbt.fromHex(signedPsbt)

    const allFinalized = psbt.data.inputs.every(
      (input) => input.finalScriptWitness || input.finalScriptSig
    )
    if (!allFinalized) {
      psbt.finalizeAllInputs()
    }

    return psbt.toHex()
  }

  signPsbts = async (
    psbtsHexes: string[],
    options?: SignPsbtOptions[]
  ): Promise<string[]> => {
    if (!psbtsHexes && !Array.isArray(psbtsHexes)) {
      throw new Error('params error')
    }
    const curOptions =
      options ||
      psbtsHexes.map((_) => {
        return {
          autoFinalized: true
        }
      })
    const data = {
      method: 'signPsbt',
      params: {
        // @ts-ignore
        from: this.bitcoinNetworkProvider.selectedAddress,
        __internalFunc: '__signPsbts_babylon',
        psbtHex: '_',
        psbtHexs: psbtsHexes,
        options: curOptions
      }
    }

    try {
      // @ts-ignore
      let signedPsbts = await this.bitcoinNetworkProvider.request(
        'dappsSign',
        data
      )
      signedPsbts = signedPsbts.split(',')
      return signedPsbts.map((tx: string) => {
        const psbt = Psbt.fromHex(tx)

        const allFinalized = psbt.data.inputs.every(
          (input) => input.finalScriptWitness || input.finalScriptSig
        )
        if (!allFinalized) {
          psbt.finalizeAllInputs()
        }

        return psbt.toHex()
      })
    } catch (error) {
      throw new Error((error as Error)?.message)
    }
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      INTERNAL_NETWORK_NAMES[network] as Network
    )
  }

  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    // @ts-ignore
    return await this.bitcoinNetworkProvider?.getInscriptions?.(cursor, size)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(bitgetBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(bitgetBTCWalletOption.img)
  }
}

export const bitgetBTCWalletOption = {
  id: 'bitcoin_bitget',
  img: bitgetIcon,
  name: 'Bitget Wallet',
  chainType: 'bitcoin',
  connectProvider: BitgetBTCWallet,
  type: 'extension'
} as TomoWallet
