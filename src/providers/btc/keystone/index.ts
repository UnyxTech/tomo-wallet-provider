import KeystoneSDK, { KeystoneBitcoinSDK, UR } from '@keystonehq/keystone-sdk'
import sdk, {
  PlayStatus,
  ReadStatus,
  SDK,
  SupportedResult
} from '@keystonehq/sdk'
import { HDKey } from '@scure/bip32'
import { PsbtInput } from 'bip174/src/lib/interfaces'
import {
  Network as BitcoinNetwork,
  payments,
  Psbt,
  Transaction
} from 'bitcoinjs-lib'
import { tapleafHash } from 'bitcoinjs-lib/src/payments/bip341'
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371'
import { pubkeyInScript } from 'bitcoinjs-lib/src/psbt/psbtutils'
import { Network, ProviderOption } from '../../../WalletProvider'

import BIP322 from './bip322'
import { toNetwork } from '../../../config/network.config'
import { initBTCEccLib } from '../../../utils/eccLibUtils'
import { BTCProvider, SignPsbtOptions } from '../BTCProvider'
import { TomoWallet } from '../../../types'
import keystoneIcon from '../../../icons/keystone.svg'

type KeystoneWalletInfo = {
  mfp: string | undefined
  extendedPublicKey: string | undefined
  path: string | undefined
  address: string | undefined
  publicKeyHex: string | undefined
  scriptPubKeyHex: string | undefined
}

// @ts-expect-error fix build undefined
const curSdk = sdk.default ? sdk.default : sdk
// @ts-expect-error fix build undefined
const curKeystoneSDK = KeystoneSDK?.default ? KeystoneSDK.default : KeystoneSDK

export class KeystoneWallet extends BTCProvider {
  private keystoneWaleltInfo: KeystoneWalletInfo
  private viewSDK: typeof sdk
  private dataSdk: KeystoneSDK
  private networkEnv: Network | undefined

  constructor(option: ProviderOption) {
    // @ts-ignore
    super(option, {})
    initBTCEccLib()

    curSdk.bootstrap()

    this.viewSDK = curSdk
    this.dataSdk = new curKeystoneSDK({
      origin: ''
    })
    this.networkEnv = Network.MAINNET
    // @ts-ignore
    this.keystoneWaleltInfo = {}
  }

  /**
   * Connects the staking app to the Keystone device and retrieves the necessary information.
   * @returns A Promise that resolves to the current instance of the class.
   * @throws An error if there is an issue reading the QR code or retrieving the extended public key.
   */
  connectWallet = async (): Promise<this> => {
    const keystoneContainer = await this.viewSDK.getSdk()

    // Initialize the Keystone container and read the QR code for sync keystone device with the staking app.
    const decodedResult = await keystoneContainer.read(
      [SupportedResult.UR_CRYPTO_ACCOUNT],
      {
        title: 'Sync Keystone with Babylon Staking App',
        description:
          'Please scan the QR code displayed on your Keystone, Currently only the first Taproot Address will be used',
        renderInitial: {
          walletMode: 'btc',
          link: '',
          description: [
            '1. Turn on your Keystone 3 with Multi-Coin firmware or BTC only firmware.',
            '2. Click "Connect Software Wallet" and choose "Babylon" or "Sparrow" for connection.',
            '3. Press the "Sync Keystone" button and scan the QR Code displayed on your Keystone hardware wallet',
            '4. The first Taproot address will be used for staking.'
          ]
        },
        URTypeErrorMessage:
          'The scanned QR code is not the sync code from the Keystone hardware wallet. Please verify the code and try again.'
      }
    )
    if (decodedResult.status === ReadStatus.canceled) {
      throw new Error('Connection to Keystone was canceled')
    } else if (decodedResult.status !== ReadStatus.success) {
      throw new Error('Error reading QR code, Please try again.')
    }

    // parse the QR Code and get extended public key and other required information
    const accountData = this.dataSdk.parseAccount(decodedResult.result)

    // currently only the p2tr address will be used.
    const P2TRINDEX = 3
    const xpub = accountData.keys[P2TRINDEX].extendedPublicKey

    this.keystoneWaleltInfo = {
      mfp: accountData.masterFingerprint,
      extendedPublicKey: xpub,
      path: accountData.keys[P2TRINDEX].path,
      address: undefined,
      publicKeyHex: undefined,
      scriptPubKeyHex: undefined
    }

    if (!this.keystoneWaleltInfo.extendedPublicKey)
      throw new Error('Could not retrieve the extended public key')

    // generate the address and public key based on the xpub
    const curentNetwork = await this.getNetwork()
    await this.switchNetwork(curentNetwork)
    return this
  }

  getAddress = async (): Promise<string> => {
    if (this.keystoneWaleltInfo?.address) {
      return this.keystoneWaleltInfo?.address
    }
    throw new Error('Could not retrieve the address')
  }

  getPublicKeyHex = async (): Promise<string> => {
    if (this.keystoneWaleltInfo?.publicKeyHex) {
      return this.keystoneWaleltInfo?.publicKeyHex
    }
    throw new Error('Could not retrieve the BTC public key')
  }

  signPsbt = async (psbtHex: string, options?: SignPsbtOptions): Promise<string> => {
    if (
      !this.keystoneWaleltInfo?.address ||
      !this.keystoneWaleltInfo?.publicKeyHex
    ) {
      throw new Error('Keystone Wallet not connected')
    }
    if (!psbtHex) throw new Error('psbt hex is required')
    // enhance the PSBT with the BIP32 derivation information
    // to tell keystone which key to use to sign the PSBT
    let psbt = Psbt.fromHex(psbtHex)
    psbt = this.enhancePsbt(psbt)
    const enhancedPsbt = psbt.toHex()
    // sign the psbt with keystone
    const signedPsbt = await this.sign(enhancedPsbt)
    return signedPsbt.toHex()
  }

  signPsbts = async (psbtsHexes: string[], options?: SignPsbtOptions[]): Promise<string[]> => {
    if (
      !this.keystoneWaleltInfo?.address ||
      !this.keystoneWaleltInfo?.publicKeyHex
    ) {
      throw new Error('Keystone Wallet not connected')
    }
    if (!psbtsHexes && !Array.isArray(psbtsHexes))
      throw new Error('psbts hexes are required')

    const result = []
    for (const psbt of psbtsHexes) {
      const signedHex = await this.signPsbt(psbt)
      result.push(signedHex)
    }
    return result
  }

  getNetwork = async (): Promise<Network> => {
    if (!this.networkEnv) {
      throw new Error('Network not set')
    }
    return this.networkEnv
  }

  /**
   * https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
   * signMessageBIP322 signs a message using the BIP322 standard.
   * @param message
   * @returns signature
   */
  signMessageBIP322 = async (message: string): Promise<string> => {
    // construct the psbt of Bip322 message signing
    const scriptPubKey = Buffer.from(
      this.keystoneWaleltInfo!.scriptPubKeyHex!,
      'hex'
    )
    const toSpendTx = BIP322.buildToSpendTx(message, scriptPubKey)
    const internalPublicKey = toXOnly(
      Buffer.from(this.keystoneWaleltInfo!.publicKeyHex!, 'hex')
    )
    let psbt = BIP322.buildToSignTx(
      toSpendTx.getId(),
      scriptPubKey,
      false,
      internalPublicKey
    )
    // Set the sighashType to bitcoin.Transaction.SIGHASH_ALL since it defaults to SIGHASH_DEFAULT
    psbt.updateInput(0, {
      sighashType: Transaction.SIGHASH_ALL
    })

    // ehance the PSBT with the BIP32 derivation information
    psbt = this.enhancePsbt(psbt)
    const signedPsbt = await this.sign(psbt.toHex())
    return BIP322.encodeWitness(signedPsbt)
  }

  signMessageECDSA = async (message: string): Promise<string> => {
    if (!this.keystoneWaleltInfo)
      throw new Error('Keystone Wallet not connected')

    const ur = this.dataSdk.btc.generateSignRequest({
      requestId: '7afd5e09-9267-43fb-a02e-08c4a09417ec',
      signData: Buffer.from(message, 'utf-8').toString('hex'),
      dataType: KeystoneBitcoinSDK.DataType.message,
      accounts: [
        {
          path: `${this.keystoneWaleltInfo.path}/0/0`,
          xfp: `${this.keystoneWaleltInfo.mfp}`,
          address: this.keystoneWaleltInfo.address
        }
      ],
      origin: 'babylon staking app'
    })

    const signMessage = composeQRProcess(SupportedResult.UR_BTC_SIGNATURE)

    const keystoneContainer = await this.viewSDK.getSdk()
    const signedMessageUR = await signMessage(keystoneContainer, ur)

    const result = this.dataSdk.btc.parseSignature(signedMessageUR)
    return Buffer.from(result.signature, 'hex').toString('base64')
  }

  async signMessage(
    message: string,
    type: 'ecdsa' | 'bip322-simple' = 'ecdsa'
  ): Promise<string> {
    if (type === 'bip322-simple') {
      return await this.signMessageBIP322(message)
    } else if (type === 'ecdsa') {
      return await this.signMessageECDSA(message)
    }
    throw new Error('Unsupported message signing type')
  }

  /**
   * Sign the PSBT with the Keystone device.
   *
   * @param psbtHex - The PSBT in hex format.
   *  @returns The signed PSBT in hex format.
   * */
  private sign = async (psbtHex: string): Promise<Psbt> => {
    if (!psbtHex) throw new Error('psbt hex is required')
    const ur = this.dataSdk.btc.generatePSBT(Buffer.from(psbtHex, 'hex'))

    // compose the signing process for the Keystone device
    const signPsbt = composeQRProcess(SupportedResult.UR_PSBT)

    const keystoneContainer = await this.viewSDK.getSdk()
    const signePsbtUR = await signPsbt(keystoneContainer, ur)

    // extract the signed PSBT from the UR
    const signedPsbtHex = this.dataSdk.btc.parsePSBT(signePsbtUR)
    const signedPsbt = Psbt.fromHex(signedPsbtHex)
    signedPsbt.finalizeAllInputs()
    return signedPsbt
  }

  /**
   * Add the BIP32 derivation information for each input.
   * The Keystone device is stateless, so it needs to know which key to use to sign the PSBT.
   * Therefore, add the Taproot BIP32 derivation information to the PSBT.
   * https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#Specification
   * @param psbt - The PSBT object.
   * @returns The PSBT object with the BIP32 derivation information added.
   */
  private enhancePsbt = (psbt: Psbt): Psbt => {
    if (
      !this.keystoneWaleltInfo?.scriptPubKeyHex ||
      !this.keystoneWaleltInfo?.publicKeyHex ||
      !this.keystoneWaleltInfo?.mfp ||
      !this.keystoneWaleltInfo?.path
    ) {
      throw new Error('Keystone Wallet not connected')
    }

    const bip32Derivation = {
      masterFingerprint: Buffer.from(this.keystoneWaleltInfo!.mfp!, 'hex'),
      path: `${this.keystoneWaleltInfo!.path!}/0/0`,
      pubkey: Buffer.from(this.keystoneWaleltInfo!.publicKeyHex!, 'hex')
    }

    psbt.data.inputs.forEach((input) => {
      input.tapBip32Derivation = [
        {
          ...bip32Derivation,
          pubkey: toXOnly(bip32Derivation.pubkey),
          leafHashes: caculateTapLeafHash(input, bip32Derivation.pubkey)
        }
      ]
    })
    return psbt
  }

  // Not implemented because of the Airgapped HW nature
  on = (): void => {}
  off = (): void => {}

  async switchNetwork(network: Network) {
    this.networkEnv = network
    const { address, pubkeyHex, scriptPubKeyHex } = generateP2trAddressFromXpub(
      // @ts-ignore
      this.keystoneWaleltInfo.extendedPublicKey,
      'M/0/0',
      toNetwork(network)
    )
    this.keystoneWaleltInfo.address = address
    this.keystoneWaleltInfo.publicKeyHex = pubkeyHex
    this.keystoneWaleltInfo.scriptPubKeyHex = scriptPubKeyHex
  }

  async sendBitcoin(to: string, satAmount: number) {
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
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(keystoneBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(keystoneBTCWalletOption.img)
  }
}

export const keystoneBTCWalletOption = {
  id: 'bitcoin_keystone',
  img: keystoneIcon,
  name: 'Keystone',
  chainType: 'bitcoin',
  connectProvider: KeystoneWallet,
  type: 'qrcode'
} as TomoWallet

/**
 * High order function to compose the QR generation and scanning process for specific data types.
 * Composes the QR code process for the Keystone device.
 * @param destinationDataType - The type of data to be read from the QR code.
 * @returns A function that plays the UR in the QR code and reads the result.
 */
const composeQRProcess =
  (destinationDataType: SupportedResult) =>
  async (container: SDK, ur: UR): Promise<UR> => {
    // make the container play the UR in the QR code
    const status: PlayStatus = await container.play(ur, {
      title: 'Scan the QR Code',
      description: 'Please scan the QR code with your Keystone device.'
    })

    // if the QR code is scanned successfully, read the result
    if (status !== PlayStatus.success)
      throw new Error('Could not generate the QR code, please try again.')

    const urResult = await container.read([destinationDataType], {
      title: 'Get the Signature from Keystone',
      description: 'Please scan the QR code displayed on your Keystone',
      URTypeErrorMessage:
        "The scanned QR code can't be read. please verify and try again."
    })

    // return the result if the QR code data(UR) of scanned successfully
    if (urResult.status !== ReadStatus.success)
      throw new Error('Could not extract the signature, please try again.')
    return urResult.result
  }

/**
 * Generates the p2tr Bitcoin address from an extended public key and a path.
 * @param xpub - The extended public key.
 * @param path - The derivation path.
 * @param network - The Bitcoin network.
 * @returns The Bitcoin address and the public key as a hex string.
 */
const generateP2trAddressFromXpub = (
  xpub: string,
  path: string,
  network: BitcoinNetwork
): { address: string; pubkeyHex: string; scriptPubKeyHex: string } => {
  const hdNode = HDKey.fromExtendedKey(xpub)
  const derivedNode = hdNode.derive(path)
  const pubkeyBuffer = Buffer.from(derivedNode.publicKey!)
  const childNodeXOnlyPubkey = toXOnly(pubkeyBuffer)
  const { address, output } = payments.p2tr({
    internalPubkey: childNodeXOnlyPubkey,
    network
  })
  return {
    address: address!,
    pubkeyHex: pubkeyBuffer.toString('hex'),
    scriptPubKeyHex: output!.toString('hex')
  }
}

/**
 * Calculates the tap leaf hashes for a given PsbtInput and public key.
 * @param input - The PsbtInput object.
 * @param pubkey - The public key as a Buffer.
 * @returns An array of tap leaf hashes.
 */
const caculateTapLeafHash = (input: PsbtInput, pubkey: Buffer) => {
  if (input.tapInternalKey && !input.tapLeafScript) {
    return []
  }
  const tapLeafHashes = (input.tapLeafScript || [])
    .filter((tapLeaf) => pubkeyInScript(pubkey, tapLeaf.script))
    .map((tapLeaf) => {
      const hash = tapleafHash({
        output: tapLeaf.script,
        version: tapLeaf.leafVersion
      })
      return Object.assign({ hash }, tapLeaf)
    })

  return tapLeafHashes.map((each) => each.hash)
}
