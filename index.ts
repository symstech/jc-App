import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widget-task-handler';
import App from './src/app/index'; // ya aapka entry file

// Sirf Android native environment me register karein
if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}

registerRootComponent(App);