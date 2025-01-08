import {
  TomoContextProvider,
  TomoSocial,
  useTomoModalControl,
  useTomoProps,
  useTomoProviders,
  useTomoWalletConnect,
  useTomoWalletState,
  useWalletList
} from '@tomo-inc/wallet-connect-sdk'
import React, { useState } from 'react'

import {
  ChainType,
  TomoProviderSetting
  // @ts-ignore
} from '@tomo-inc/wallet-connect-sdk/dist/state'
import '@tomo-inc/wallet-connect-sdk/style.css'
import { btcWalletList, cosmosWalletList } from '../main'

// window.injectedTomo = {
//   info: {
//     name: 'Tomo Inject xxx',
//     logo: 'https://logincdn.msauth.net/16.000.30389.5/images/favicon.ico'
//   },
//   bitcoin: window.unisat,
//   cosmos: window.keplr
// }

export default function Demo() {
  const [style, setStyle] = useState<TomoProviderSetting['style']>({
    rounded: 'small',
    theme: 'light',
    primaryColor: '#FF7C2A'
  })

  return (
    <TomoContextProvider
      style={style}
      // @ts-ignore
      additionalWallets={[...btcWalletList, ...cosmosWalletList]}
    >
      <ChildComponent style={style} setStyle={setStyle} />
    </TomoContextProvider>
  )
}

type ChildProps = {
  style: TomoProviderSetting['style']
  setStyle: (v: TomoProviderSetting['style']) => void
}
export function ChildComponent(props: ChildProps) {
  const tomoModal = useTomoModalControl()
  const tomoWalletState = useTomoWalletState()
  const providers = useTomoProviders()
  const tomoProps = useTomoProps()
  const tomoWalletConnect = useTomoWalletConnect()
  const walletList = useWalletList()

  const cosmosIsConnect = tomoWalletState.cosmos?.connected
  const btcIsConnect = tomoWalletState.bitcoin?.connected

  const [cosmosAddress, setCosmosAddress] = useState('')
  const [curChainType, setCurChainType] = useState<ChainType>('bitcoin')

  const sendAtom = async (address: string, amount: string) => {
    if (!providers.cosmosProvider) {
      throw new Error('cosmosProvider not found')
    }
    const selfAddress = await providers.cosmosProvider.getAddress()
    const client = await providers.cosmosProvider.getSigningStargateClient()
    const result = await client.sendTokens(
      selfAddress,
      address,
      [
        {
          denom: 'uatom',
          amount: amount
        }
      ],
      {
        amount: [{ denom: 'uatom', amount: '500' }],
        gas: '200000'
      }
    )
    console.log('result', result)
  }

  return (
    <div className={'tomo-social tm-flex tm-h-full tm-w-full tm-text-sm'}>
      <div className={'tomo-social tm-flex tm-h-screen tm-w-screen tm-text-sm'}>
        <div
          className={
            'tm-hidden tm-h-full tm-flex-col tm-gap-4 tm-overflow-auto tm-border-r tm-border-r-tc1/10 tm-p-10 md:tm-flex md:tm-flex-1'
          }
        >
          <div className={'tm-flex tm-flex-wrap tm-gap-3'}>
            <LodingButton
              disabled={cosmosIsConnect}
              onClick={() => {
                tomoModal.open('cosmos')
              }}
            >
              tomo modal - cosmos
            </LodingButton>

            <LodingButton
              disabled={btcIsConnect}
              onClick={async () => {
                const result = await tomoModal.open('bitcoin')
                console.log('modal result', result)
              }}
            >
              tomo modal - bitcoin
            </LodingButton>
            <LodingButton
              disabled={!btcIsConnect && !cosmosIsConnect}
              onClick={async () => {
                await tomoWalletConnect.disconnect()
              }}
            >
              disconnect
            </LodingButton>

            <div className={'tm-w-full'} />
            <input
              value={cosmosAddress}
              onChange={(e) => setCosmosAddress(e.target.value)}
            />
            <LodingButton
              disabled={!cosmosIsConnect}
              onClick={async () => {
                await sendAtom(cosmosAddress, '10000')
              }}
            >
              send atom
            </LodingButton>

            <LodingButton
              disabled={!cosmosIsConnect}
              onClick={async () => {
                const result =
                  await providers.cosmosProvider?.getBalance('uatom')
                console.log('cosmos balance', result)
              }}
            >
              cosmosProvider.getBalance('uatom')
            </LodingButton>

            <div className={'tm-w-full'} />
            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result = await providers.bitcoinProvider?.getBalance()
                  console.log('btc balance', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc getBalance()
            </LodingButton>

            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result =
                    await providers.bitcoinProvider?.getInscriptions()
                  console.log('btc getInscriptions', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc getInscriptions()
            </LodingButton>
            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result = await providers.bitcoinProvider?.getUtxos(
                    await providers.bitcoinProvider?.getAddress()
                  )
                  console.log('btc getUtxos', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc getUtxos()
            </LodingButton>
            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result =
                    await providers.bitcoinProvider?.getBTCTipHeight()
                  console.log('btc getBTCTipHeight', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc getBTCTipHeight()
            </LodingButton>

            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result = await providers.bitcoinProvider?.signMessage(
                    '11',
                    'ecdsa'
                  )
                  console.log('btc signMessage ecdsa', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc signMessage('11', 'ecdsa')
            </LodingButton>

            <LodingButton
              disabled={!btcIsConnect}
              onClick={async () => {
                try {
                  const result = await providers.bitcoinProvider?.signMessage(
                    '11',
                    'bip322-simple'
                  )
                  console.log('btc signMessage bip322-simple', result)
                } catch (e) {
                  console.log(e)
                }
              }}
            >
              btc signMessage('11', 'bip322-simple')
            </LodingButton>
          </div>
          <StyleSetting {...props} />

          <ShowJson obj={tomoWalletState} title={'useTomoWalletState'} />
          <ShowJson obj={providers} title={'useTomoProviders'} />
          <ShowJson obj={tomoProps} title={'useTomoProps'} />
          <ShowJson obj={walletList} title={'useWalletList'} />
        </div>
        <div
          className={
            'tm-flex tm-h-full tm-w-full tm-flex-col tm-items-center tm-gap-4 tm-overflow-auto tm-px-4 tm-py-10 md:tm-w-auto md:tm-px-6'
          }
        >
          <div>tomo connect</div>
          <div>
            <LodingButton onClick={() => setCurChainType('bitcoin')}>
              bitcoin
            </LodingButton>
            <LodingButton onClick={() => setCurChainType('cosmos')}>
              cosmos
            </LodingButton>
          </div>
          <div>
            <LodingButton
              onClick={() => {
                tomoModal.open(curChainType)
              }}
            >
              open modal
            </LodingButton>
            <LodingButton
              disabled={!btcIsConnect && !cosmosIsConnect}
              onClick={async () => {
                await tomoWalletConnect.disconnect()
              }}
            >
              disconnect
            </LodingButton>
          </div>

          <TomoSocial chainType={curChainType} />
        </div>
      </div>
    </div>
  )
}

function StyleSetting({ style, setStyle }: ChildProps) {
  return (
    <div className={'tm-flex tm-gap-4'}>
      <div>style</div>
      <div>
        <div>rounded</div>
        <select
          value={style?.rounded}
          onChange={(e) => {
            setStyle({
              ...style,
              // @ts-ignore
              rounded: e.target.value
            })
          }}
        >
          <option>none</option>
          <option>small</option>
          <option>medium</option>
          <option>large</option>
        </select>
      </div>
      <div>
        <div>theme</div>
        <div>
          <LodingButton
            onClick={(e) => {
              setStyle({
                ...style,
                theme: 'light'
              })
            }}
          >
            light
          </LodingButton>
          <LodingButton
            onClick={(e) => {
              setStyle({
                ...style,
                theme: 'dark'
              })
            }}
          >
            dark
          </LodingButton>
        </div>
      </div>
      <div>
        <div>primary</div>
        <div>
          <select
            value={style?.primaryColor}
            onChange={(e) => {
              setStyle({
                ...style,
                primaryColor: e.target.value
              })
            }}
          >
            <option value={'#121212'}>default</option>
            <option value={'#FF7C2A'}>#FF7C2A</option>
            <option value={'#F21F7F'}>#F21F7F</option>
            <option value={'#fcd535'}>#fcd535</option>
            <option value={'#4285f4'}>#4285f4</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function LodingButton({
  onClick,
  disabled,
  ...otherProps
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      {...otherProps}
      className={'tm-border tm-border-tc1 tm-px-1.5'}
      disabled={loading || disabled}
      onClick={async () => {
        try {
          setLoading(true)
          // @ts-ignore
          await onClick()
        } finally {
          setLoading(false)
        }
      }}
    />
  )
}

const ShowJson = React.memo(function ShowJson({
  title,
  obj,
  rows = 10
}: {
  title: any
  obj: any
  rows?: number
}) {
  const jsonFn = function jsonValueFn(key: any, value: any) {
    // @ts-ignore
    if (key && this !== obj) {
      if (typeof value === 'object' || typeof value === 'function') {
        if (Array.isArray(value)) {
          return `Array(${value.length})`
        }
        return 'object'
      }
      return value
    }
    return value
  }
  return (
    <div>
      <div>{title}: </div>
      <textarea
        value={JSON.stringify(obj, jsonFn, '\t')}
        className={'tm-w-full tm-border tm-px-1'}
        rows={rows}
        readOnly
      ></textarea>
    </div>
  )
})
