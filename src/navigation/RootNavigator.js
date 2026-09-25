import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import TabNavigator from './TabNavigator';
import GameLobbyScreen from '../screens/games/GameLobbyScreen';
import WhotGameScreen from '../screens/games/WhotGameScreen';
import LudoGameScreen from '../screens/games/LudoGameScreen';
import AyoGameScreen from '../screens/games/AyoGameScreen';
import DraughtsGameScreen from '../screens/games/DraughtsGameScreen';
import WhotSetupScreen from '../screens/games/WhotSetupScreen';
import LudoSetupScreen from '../screens/games/LudoSetupScreen';
import GameSectionScreen from '../screens/games/GameSectionScreen';
import BuyCoinsScreen from '../screens/wallet/BuyCoinsScreen';
import PaymentScreen from '../screens/wallet/PaymentScreen';
import WithdrawScreen from '../screens/wallet/WithdrawScreen';
import DailyStreakScreen from '../screens/profile/DailyStreakScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AccountSecurityScreen from '../screens/profile/AccountSecurityScreen';
import InviteFriendsScreen from '../screens/profile/InviteFriendsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';
import CreateTournamentScreen from '../screens/tour/CreateTournamentScreen';
import TournamentDetailsScreen from '../screens/tour/TournamentDetailsScreen';
import LiveTournamentScreen from '../screens/tour/LiveTournamentScreen';
import PrivacySecurityScreen from '../screens/profile/PrivacySecurityScreen';
import GameSetupScreen from '../screens/games/GameSetupScreen';
import TournamentResultsScreen from '../screens/tour/TournamentResultsScreen';
import TournamentPendingScreen from '../screens/tour/TournamentPendingScreen';
import ChallengeHubScreen from '../screens/challenge/ChallengeHubScreen';

import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ProfileCreationScreen from '../screens/auth/ProfileCreationScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SellCoinsScreen from '../screens/wallet/SellCoinsScreen';
import GameResultScreen from '../screens/games/GameResultScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="ChallengeHub" component={ChallengeHubScreen} />
      <Stack.Screen name="WhotGame" component={WhotGameScreen} />
      <Stack.Screen name="LudoGame" component={LudoGameScreen} />
      <Stack.Screen name="AyoGame" component={AyoGameScreen} />
      <Stack.Screen name="DraughtsGame" component={DraughtsGameScreen} />
      <Stack.Screen name="WhotSetup" component={WhotSetupScreen} />
      <Stack.Screen name="LudoSetup" component={LudoSetupScreen} />
      <Stack.Screen name="GameSetup" component={GameSetupScreen} />
      <Stack.Screen name="GameSection" component={GameSectionScreen} />
      <Stack.Screen name="BuyCoins" component={BuyCoinsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="SellCoins" component={SellCoinsScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="DailyStreak" component={DailyStreakScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <Stack.Screen name="Referrals" component={InviteFriendsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
      <Stack.Screen name="TournamentDetails" component={TournamentDetailsScreen} />
      <Stack.Screen name="LiveTournament" component={LiveTournamentScreen} />
      <Stack.Screen name="TournamentResults" component={TournamentResultsScreen} />
      <Stack.Screen name="TournamentPending" component={TournamentPendingScreen} />
      <Stack.Screen name="GameResult" component={GameResultScreen} />
    </Stack.Navigator>
  );
}
