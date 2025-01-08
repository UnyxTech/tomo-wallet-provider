import {
  ProviderOption,
  TomoCosmosInjected,
  WalletProvider
} from '../../WalletProvider'
import {
  AminoSignResponse,
  KeplrSignOptions,
  StdSignature,
  StdSignDoc
} from '@keplr-wallet/types'
import {
  OfflineAminoSigner,
  OfflineDirectSigner
} from '@keplr-wallet/types/src/cosmjs'
import { SigningStargateClient } from '@cosmjs/stargate'
import { SigningStargateClientOptions } from '@cosmjs/stargate/build/signingstargateclient'
import { DeliverTxResponse } from '@cosmjs/stargate/build/stargateclient'
import { Buffer } from 'buffer'

const DEFAULT_RPC = 'https://cosmoshub.validator.network:443'

export abstract class CosmosProvider extends WalletProvider {
  provider: TomoCosmosInjected
  offlineSigner?: OfflineAminoSigner & OfflineDirectSigner
  clientPromise?: Promise<SigningStargateClient>
  constructor(option: ProviderOption, provider: TomoCosmosInjected) {
    super(option)
    this.provider = provider
  }

  async connectWallet(): Promise<this> {
    const curChainId = await this.getNetwork()
    await this.provider.enable(curChainId)
    this.offlineSigner = this.provider.getOfflineSigner(curChainId)
    await this.getAddress()
    return this
  }

  initSigningStargateClient(client: SigningStargateClient) {
    this.clientPromise = Promise.resolve(client)
  }

  /**
   * get @cosmjs/stargate SigningStargateClient
   */
  async getSigningStargateClient(options?: SigningStargateClientOptions) {
    if (!this.clientPromise) {
      this.clientPromise = this.createSigningStargateClient(options)
    }
    return await this.clientPromise
  }

  async createSigningStargateClient(options?: SigningStargateClientOptions) {
    const rpcUrl = this.chains?.[0]?.backendUrls?.rpcUrl || DEFAULT_RPC
    if (!this.offlineSigner) {
      throw new Error('Offline signer is not initialized')
    }
    return await SigningStargateClient.connectWithSigner(
      rpcUrl,
      this.offlineSigner,
      options
    )
  }

  async getBalance(searchDenom: string) {
    const signingStargateClient = await this.getSigningStargateClient()
    return BigInt(
      (
        await signingStargateClient.getBalance(
          await this.getAddress(),
          searchDenom
        )
      ).amount
    )
  }

  /**
   * Gets the bech32Address of the connected wallet.
   * @returns A promise that resolves to the address of the connected wallet.
   */
  async getAddress(): Promise<string> {
    const curChainId = await this.getNetwork()
    const key = await this.provider.getKey(curChainId)
    return key.bech32Address
  }

  /**
   * get the chainId of the connected wallet
   */
  async getNetwork(): Promise<string> {
    return this.chains?.[0]?.network
  }

  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions
  ): Promise<AminoSignResponse> {
    const chainId = await this.getNetwork()
    if (chainId !== signDoc.chain_id) {
      throw new Error('Unmatched chain id with the offline signer')
    }

    const curAddress = await this.getAddress()

    if (curAddress !== signerAddress) {
      throw new Error('Unknown signer address')
    }

    return await this.provider.signAmino(
      chainId,
      signerAddress,
      signDoc,
      signOptions
    )
  }

  async signArbitrary(
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature> {
    const chainId = await this.getNetwork()
    return await this.provider.signArbitrary(chainId, signer, data)
  }

  async broadcastTx(
    tx: Uint8Array,
    timeoutMs?: number,
    pollIntervalMs?: number
  ): Promise<DeliverTxResponse> {
    const signingStargateClient = await this.getSigningStargateClient()
    return await signingStargateClient.broadcastTx(
      tx,
      timeoutMs,
      pollIntervalMs
    )
  }

  async getPublicKeyHex() {
    const curChainId = await this.getNetwork()
    const key = await this.provider.getKey(curChainId)
    return Buffer.from(key.pubKey).toString('hex')
  }

  async getOfflineSigner() {
    const curChainId = await this.getNetwork()
    return this.provider.getOfflineSigner(curChainId)
  }
}
