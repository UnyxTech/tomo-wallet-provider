import { address, networks, Psbt } from 'bitcoinjs-lib'
import { createUnsecuredToken } from 'jsontokens'
import { getWindow, Network, ProviderOption } from 'WalletProvider'
import xverseIcon from '../../icons/xverse.png'
import { BTCProvider, SignPsbtOptions } from './BTCProvider'
import { TomoWallet } from '../../types'

type XverseAddress = {
  address: string
  addressType: string
  publicKey: string
  purpose: 'ordinals' | 'payment' | 'stacks'
}

export class XverseBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    const win = getWindow(option)
    // @ts-ignore
    const provider = win?.XverseProviders?.BitcoinProvider
    if (!provider) {
      throw new Error('Xverse Wallet extension not found')
    }
    // @ts-ignore
    super(option, provider)
  }

  // async requestAccounts() {
  //   await this.connectWallet()
  //   return await this.getAccounts()
  // }
  //
  // async getAccounts() {
  //   return [await this.getAddress()]
  // }
  // async getPublicKey() {
  //   return this.getPublicKeyHex()
  // }

  async request(name: string, data?: any) {
    // @ts-ignore
    const response = await this.bitcoinNetworkProvider.request(
      name,
      data || null
    )
    if (response.error) {
      throw new Error(response.error?.message)
    }
    if (response.result === undefined) {
      throw new Error('Received unknown response from provider.')
    }
    return response.result
  }

  getConnectionInfo = async () => {
    const resultAddresses = await this.request('getAddresses', {
      purposes: ['ordinals']
    })
    if (!resultAddresses.addresses?.length) {
      throw new Error('Failed to connect to Xverse Wallet')
    }
    return resultAddresses.addresses[0] as XverseAddress
  }

  connectWallet = async (): Promise<this> => {
    try {
      const permissions = await this.request('wallet_getCurrentPermissions')
      if (!permissions.length) {
        throw new Error('No permissions found.')
      }
      return this
    } catch (e) {
      const response = await this.request('wallet_connect')
      if (
        !response.addresses?.length ||
        !response.addresses.some((e: XverseAddress) => e.purpose === 'ordinals')
      ) {
        throw new Error('Failed to connect to Xverse Wallet')
      }
      return this
    }
  }

  async getAddress(): Promise<string> {
    return (await this.getConnectionInfo()).address
  }

  async getPublicKeyHex(): Promise<string> {
    const publicKey = (await this.getConnectionInfo()).publicKey
    if (publicKey.length === 64) {
      return '03' + publicKey
    }
    return publicKey
  }

  async switchNetwork(network: Network) {
    throw new Error(
      `please use the Xverse wallet extension to switch networks: ${network}`
    )
  }

  async getNetwork(): Promise<Network> {
    const addressStr = await this.getAddress()
    if (addressStr.startsWith('bc1')) {
      return Network.MAINNET
    } else if (addressStr.startsWith('tb1')) {
      return Network.SIGNET
    }
    throw new Error('Unknown network')
  }

  async sendBitcoin(to: string, satAmount: number) {
    const response = await this.request('sendTransfer', {
      recipients: [
        {
          address: to,
          amount: satAmount
        }
      ]
    })
    return response?.txid
  }

  getBalance = async (): Promise<number> => {
    const result = await this.request('getBalance', undefined)
    return result.confirmed
  }

  async signMessage(
    message: string,
    type: 'ecdsa' | 'bip322-simple' = 'ecdsa'
  ): Promise<string> {
    const result = await this.request('signMessage', {
      address: await this.getAddress(),
      message,
      protocol: type === 'bip322-simple' ? 'BIP322' : 'ECDSA'
    })
    return result.signature
  }

  private getSignPsbtDefaultOptions(
    psbtHex: string,
    curOption: {
      curNetwork: Network
      curAddress: string
      curPublicKey: string
    }
  ): any {
    const psbt = Psbt.fromHex(psbtHex)
    const { curNetwork, curPublicKey, curAddress } = curOption
    const toSignInputs: Record<string, number[]> = {
      [curAddress]: []
    }
    psbt.data.inputs.forEach((input, index) => {
      let useTweakedSigner = false
      if (input.witnessUtxo && input.witnessUtxo.script) {
        let btcNetwork = networks.bitcoin
        if (curNetwork === Network.TESTNET || curNetwork === Network.SIGNET) {
          btcNetwork = networks.testnet
        }
        let addressToBeSigned
        try {
          addressToBeSigned = address.fromOutputScript(
            input.witnessUtxo.script,
            btcNetwork
          )
        } catch (error: Error | any) {
          if (
            error instanceof Error &&
            error.message.toLowerCase().includes('has no matching address')
          ) {
            addressToBeSigned = address.fromOutputScript(
              input.witnessUtxo.script,
              btcNetwork
            )
          } else {
            throw new Error(error)
          }
        }
        // check if the address is a taproot address
        const isTaproot =
          addressToBeSigned.indexOf('tb1p') === 0 ||
          addressToBeSigned.indexOf('bc1p') === 0
        // check if the address is the same as the wallet address
        const isWalletAddress = addressToBeSigned === curAddress
        // tweak the signer if needed
        if (isTaproot && isWalletAddress) {
          useTweakedSigner = true
        }
      }
      const signed = input.finalScriptSig || input.finalScriptWitness
      if (!signed) {
        toSignInputs[curAddress].push(index)
      }
    })
    return {
      psbtBase64: psbt.toBase64(),
      toSignInputs
    }
  }

  signPsbt = async (psbtHex: string, options?: SignPsbtOptions): Promise<string> => {
    if (!psbtHex) throw new Error('psbt hex is required')
    const opt = {
      curNetwork: await this.getNetwork(),
      curAddress: await this.getAddress(),
      curPublicKey: await this.getPublicKeyHex()
    }

    if (!opt.curAddress) throw new Error('Wallet not connected')

    try {
      const { psbtBase64, toSignInputs } = this.getSignPsbtDefaultOptions(
        psbtHex,
        opt
      )

      const response = await this.request('signPsbt', {
        psbt: psbtBase64,
        signInputs: toSignInputs
      })
      const psbt = Psbt.fromBase64(response.psbt)
      psbt.finalizeAllInputs()
      return psbt.toHex()
    } catch (e) {
      console.error('signPsbt error', e)
      throw e
    }
  }

  signPsbts = async (psbtsHexes: string[], options?: SignPsbtOptions[]): Promise<string[]> => {
    if (!psbtsHexes && !Array.isArray(psbtsHexes))
      throw new Error('psbts hexes are required')
    const opt = {
      curNetwork: await this.getNetwork(),
      curAddress: await this.getAddress(),
      curPublicKey: await this.getPublicKeyHex()
    }
    if (!opt.curAddress) throw new Error('Unisat Wallet not connected')

    try {
      const psbts = psbtsHexes.map((psbtHex) => {
        const { psbtBase64, toSignInputs } = this.getSignPsbtDefaultOptions(
          psbtHex,
          opt
        )
        return {
          psbtBase64: psbtBase64,
          signingIndexes: toSignInputs
          // sigHash: btc.SignatureHash.SINGLE
        }
      })
      // @ts-ignore
      const result = await this.bitcoinNetworkProvider.signMultipleTransactions(
        createUnsecuredToken({
          payload: {
            network: {
              type: opt.curNetwork
            },
            message: 'Sign Transaction',
            psbts: psbts
          }
        })
      )
      return result
    } catch (e) {
      console.error('signPsbts error', e)
      throw e
    }
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(xverseBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(xverseBTCWalletOption.img)
  }
}

export const xverseBTCWalletOption = {
  id: 'bitcoin_xverse',
  img: xverseIcon,
  name: 'Xverse',
  chainType: 'bitcoin',
  connectProvider: XverseBTCWallet,
  type: 'extension'
} as TomoWallet
