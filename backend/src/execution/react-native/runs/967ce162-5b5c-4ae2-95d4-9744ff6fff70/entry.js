
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('App', () => App);

// Run the app on web
AppRegistry.runApplication('App', {
  initialProps: {},
  rootTag: document.getElementById('root')
});
    