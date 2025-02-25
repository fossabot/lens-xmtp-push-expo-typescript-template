import './polyfills';

import { useEffect, useState } from 'react';
import { Client } from '@xmtp/xmtp-js';
import { StatusBar } from 'expo-status-bar';
import * as PushAPI from '@pushprotocol/restapi';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  IBindings,
  LensConfig,
  LensProvider,
  useActiveProfile,
  useWalletLogin,
  useWalletLogout,
  staging,
} from '@lens-protocol/react';
import { providers, Wallet } from 'ethers';
import { RequiredSigner } from '@lens-protocol/react/dist/wallet/adapters/ConcreteWallet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const provider = new providers.InfuraProvider('maticmum');

// This is the private key of the `@jsisthebest.test` profile
// It's a public private key so anyone can modify the profile
// For your own convenience change to the private key of a new wallet
const testWalletPrivateKey =
  '6c434da5e5c0e3a8e0db5cf835d23e04c7592037854f0700c26836be7581c68c';

const wallet = new Wallet(testWalletPrivateKey, provider);

function bindings(): IBindings {
  return {
    getProvider: async () => provider,
    getSigner: async () => wallet as unknown as RequiredSigner,
  };
}

const lensConfig: LensConfig = {
  bindings: bindings(),
  environment: staging,
  storage: AsyncStorage,
};

const LoginButton = () => {
  const { login, isPending: loginPending } = useWalletLogin();
  const { logout, isPending: logoutPending } = useWalletLogout();
  const { data: profile } = useActiveProfile();

  const [xmtp, setXMTP] = useState<Client | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const initXMTP = async () => {
      const xmtpClient = await Client.create(wallet);
      setXMTP(xmtpClient);
    };
    const getChannelData = async () => {
      const channelData = await PushAPI.channels.getChannel({
        channel: 'eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681', // channel address in CAIP
        env: 'staging',
      });
      setChannel(channelData);
    };

    initXMTP();
    getChannelData();
  }, []);

  const onLoginPress = async () => {
    await login(wallet);
  };

  const onLogoutPress = async () => {
    await logout();
  };

  const onSendMessage = async () => {
    if (!xmtp) return;
    const conversation = await xmtp.conversations.newConversation(
      '0x3F11b27F323b62B159D2642964fa27C46C841897',
    );
    await conversation.send('gm');
  };

  const onSendNotification = async () => {
    const apiResponse = await PushAPI.payloads.sendNotification({
      signer: wallet,
      type: 3, // target
      identityType: 0, // Minimal payload
      notification: {
        title: `[SDK-TEST] notification TITLE:`,
        body: `[sdk-test] notification BODY`,
      },
      payload: {
        title: `[sdk-test] payload title`,
        body: `sample msg body`,
        cta: '',
        img: '',
      },
      recipients: 'eip155:5:0xCdBE6D076e05c5875D90fa35cc85694E1EAFBBd1', // recipient address
      channel: 'eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681', // your channel address
      env: 'staging',
    });

    console.log(apiResponse.data);
  };

  return (
    <View>
      {profile && (
        <View>
          <Text>XMTP Version: {xmtp?.apiClient.version}</Text>
          <Text>
            Push Channel: {channel.name}(#{channel.id})
          </Text>
          <Text>Lens Profile: @{profile.handle}</Text>
          <Button onPress={onSendMessage} title="Send message" />
          <Button onPress={onSendNotification} title="Send notification" />
          <Button
            disabled={logoutPending}
            onPress={onLogoutPress}
            title="Log out"
          />
        </View>
      )}
      {!profile && (
        <Button disabled={loginPending} onPress={onLoginPress} title="Log in" />
      )}
    </View>
  );
};

const App = () => {
  return (
    <LensProvider config={lensConfig}>
      <View style={styles.container}>
        <Text>Open up App.tsx to start working on your app!</Text>
        <LoginButton />
        <StatusBar style="auto" />
      </View>
    </LensProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
