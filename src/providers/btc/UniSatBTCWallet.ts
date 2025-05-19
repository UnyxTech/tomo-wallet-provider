import {
  getWindow,
  InscriptionResult,
  Network,
  ProviderOption
} from '../../WalletProvider'
import { BTCProvider, SignPsbtOptions } from './BTCProvider'
import unisatIcon from '../../icons/unisat_wallet.svg'
import { TomoWallet } from '../../types'
import { Psbt, address, networks } from 'bitcoinjs-lib'

export class UniSatBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option).unisat_wallet
    if (!bitcoinNetworkProvider) {
      throw new Error('UniSat Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    const unisatwallet = this.bitcoinNetworkProvider
    try {
      const accounts = await unisatwallet.requestAccounts()
      const compressedPublicKey = await unisatwallet.getPublicKey()
      if (!accounts || !compressedPublicKey) {
        throw new Error('Could not connect to unisat wallet')
      }
      return this
    } catch (error) {
      throw new Error('Failed to connect to unisat wallet')
    }
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      network.replace('mainnet', 'livenet') as Network
    )
  }

  async getNetwork(): Promise<Network> {
    const result = (await this.bitcoinNetworkProvider.getNetwork())
      .replace('livenet', 'mainnet')
      .replace('unknown', 'signet') as Network
    return result
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(to, satAmount)
    return result
  }

  getBalance = async (): Promise<number> => {
    // @ts-ignore
    const result = await this.bitcoinNetworkProvider.getBalance()
    // @ts-ignore
    return result.confirmed
  }

  pushTx = async (txHex: string): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  private getSignPsbtDefaultOptions(
    psbtHex: string,
    curOption: { curNetwork: Network; curAddress: string; curPublicKey: string }
  ): any {
    const toSignInputs: any[] = []
    const psbt = Psbt.fromHex(psbtHex)
    const { curNetwork, curPublicKey, curAddress } = curOption
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
        toSignInputs.push({
          index,
          publicKey: curPublicKey,
          sighashTypes: undefined,
          useTweakedSigner
        })
      }
    })
    return {
      autoFinalized: true,
      toSignInputs
    }
  }

  signPsbt = async (
    psbtHex: string,
    options?: SignPsbtOptions
  ): Promise<string> => {
    const opt = {
      curNetwork: await this.getNetwork(),
      curAddress: await this.getAddress(),
      curPublicKey: await this.getPublicKeyHex()
    }
    if (!opt.curAddress) throw new Error('Unisat Wallet not connected')
    if (!psbtHex) throw new Error('psbt hex is required')

    try {
      const defaultOptions = this.getSignPsbtDefaultOptions(psbtHex, opt)
      const signOptions = {
        ...defaultOptions,
        ...options
      }
      const signedHex = await this.bitcoinNetworkProvider.signPsbt(
        psbtHex,
        // @ts-ignore
        signOptions
      )
      return signedHex
    } catch (error: Error | any) {
      throw new Error(error?.message || error)
    }
  }

  signPsbts = async (
    psbtsHexes: string[],
    options?: SignPsbtOptions[]
  ): Promise<string[]> => {
    const opt = {
      curNetwork: await this.getNetwork(),
      curAddress: await this.getAddress(),
      curPublicKey: await this.getPublicKeyHex()
    }
    if (!opt.curAddress) throw new Error('Unisat Wallet not connected')
    if (!psbtsHexes && !Array.isArray(psbtsHexes))
      throw new Error('psbts hexes are required')

    try {
      const defaultOptions = psbtsHexes.map((psbtHex) =>
        this.getSignPsbtDefaultOptions(psbtHex, opt)
      )
      const signOptions = options?.map((option, index) => ({
        ...defaultOptions[index],
        ...option
      }))
      return await this.bitcoinNetworkProvider.signPsbts(
        psbtsHexes,
        // @ts-ignore
        signOptions
      )
    } catch (error: Error | any) {
      throw new Error(error?.message || error)
    }
  }

  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.getInscriptions(cursor, size)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(uniSatBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(uniSatBTCWalletOption.img)
  }
}

export const uniSatBTCWalletOption = {
  id: 'bitcoin_unisat',
  img: unisatIcon,
  name: 'Unisat',
  chainType: 'bitcoin',
  connectProvider: UniSatBTCWallet,
  type: 'extension'
} as TomoWallet
