import {
  getWindow,
  Network,
  ProviderOption,
  WalletInfo
} from '../../WalletProvider'

import { Psbt } from 'bitcoinjs-lib'
import { toNetwork } from '../../config/network.config'
import { BTCProvider, SignPsbtOptions } from './BTCProvider'
import { TomoWallet } from '../../types'
import imtokenIcon from '../../icons/imtoken.svg'

// window object for imToken Wallet
export const imTokenWalletProvider = 'bitcoin'

export class ImTokenBTCWallet extends BTCProvider {
  private walletInfo: WalletInfo | undefined
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option)?.[imTokenWalletProvider]
    if (!bitcoinNetworkProvider) {
      throw new Error('imToken Wallet not found')
    }
    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    // @ts-ignore
    const accounts = await this.bitcoinNetworkProvider.request({
      method: 'btc_requestAccounts'
    })

    const address = accounts[0]
    // @ts-ignore
    const publicKeyHex = await this.bitcoinNetworkProvider.request({
      method: 'btc_getPublicKey'
    })

    if (!address || !publicKeyHex) {
      throw new Error('Could not connect to imToken Wallet')
    }
    this.walletInfo = {
      publicKeyHex,
      address
    }
    return this
  }

  getAddress = async (): Promise<string> => {
    // @ts-ignore
    const accounts = await this.bitcoinNetworkProvider.request({
      method: 'btc_requestAccounts'
    })

    const address = accounts[0]
    return address
  }

  getPublicKeyHex = async (): Promise<string> => {
    if (!this.walletInfo) {
      throw new Error('imToken Wallet not connected')
    }
    return this.walletInfo.publicKeyHex
  }

  signPsbt = async (psbtHex: string, options?: SignPsbtOptions): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.request({
      method: 'btc_signPsbt',
      params: [psbtHex, options]
    })
  }

  signPsbts = async (psbtsHexes: string[], options?: SignPsbtOptions[]): Promise<string[]> => {
    if (!psbtsHexes && !Array.isArray(psbtsHexes)) {
      throw new Error('params error')
    }
    // @ts-ignore
    return await this.bitcoinNetworkProvider.request({
      method: 'btc_signPsbts',
      params: [psbtsHexes, options]
    })
  }

  async signMessage(
    message: string,
    type: 'ecdsa' | 'bip322-simple' = 'ecdsa'
  ): Promise<string> {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.request({
      method: 'btc_signMessage',
      params: [message, type]
    })
  }

  getNetwork = async (): Promise<Network> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.request({
      method: 'btc_getNetwork',
      params: []
    })
  }

  on = (eventName: string, callBack: () => void) => {
    if (eventName === 'accountChanged') {
      return this.bitcoinNetworkProvider?.on?.('accountsChanged', callBack)
    }
    return this.bitcoinNetworkProvider?.on?.(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    if (eventName === 'accountChanged') {
      return this.bitcoinNetworkProvider?.off?.('accountsChanged', callBack)
    }
    return this.bitcoinNetworkProvider?.off?.(eventName, callBack)
  }

  getBalance = async (): Promise<number> => {
    const network = await this.getNetwork()
    if (network === Network.MAINNET) {
      // @ts-ignore
      return await this.bitcoinNetworkProvider.request({
        method: 'btc_getBalance',
        params: [this.walletInfo?.address]
      })
    }
    return await super.getBalance()
  }

  async sendBitcoin(to: string, satAmount: number) {
    try {
      const walletAddress = await this.getAddress()
      const utxos = await this.getUtxos(walletAddress)
      utxos.sort((a, b) => a.value - b.value)
      let totalInput = 0
      const inputs = []
      const FeeRate = (await this.getNetworkFees()).fastestFee
      let estimatedFee = 0

      for (const utxo of utxos) {
        inputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(utxo.scriptPubKey, 'hex'),
            value: utxo.value
          }
        })

        totalInput += utxo.value

        const estimatedTxSize = inputs.length * 180 + 2 * 34 + 10
        estimatedFee = estimatedTxSize * FeeRate

        if (totalInput >= satAmount + estimatedFee) {
          break
        }
      }
      if (totalInput < satAmount + estimatedFee) {
        throw new Error('1Insufficient funds for the transaction.')
      }
      if (inputs.length === 0) {
        throw new Error('No inputs available for the transaction.')
      }
      const changeAmount = totalInput - satAmount - estimatedFee

      const psbt = new Psbt({ network: toNetwork(await this.getNetwork()) })

      for (const input of inputs) {
        psbt.addInput(input)
      }

      psbt.addOutput({
        address: to,
        value: satAmount
      })

      if (changeAmount > 0) {
        const changeAddress = await this.getAddress()
        psbt.addOutput({
          address: changeAddress,
          value: changeAmount
        })
      }

      const signedPsbtHex = await this.signPsbt(psbt.toHex())
      const pushData = Psbt.fromHex(signedPsbtHex).extractTransaction()

      const txId = await this.pushTx(pushData.toHex())
      return txId
    } catch (e) {
      throw e
    }
  }

  async switchNetwork(network: Network): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(imTokenBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(imTokenBTCWalletOption.img)
  }
}

export const imTokenBTCWalletOption = {
  id: 'bitcoin_imtoken',
  img: imtokenIcon,
  name: 'imToken',
  chainType: 'bitcoin',
  connectProvider: ImTokenBTCWallet,
  type: 'injected'
} as TomoWallet
