import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { CalendarWidget } from './calenderwidget';

const CACHE_KEY = 'CALENDAR_WIDGET_DATA';
const API_URL = 'https://dsdev.symstech.com/api/dumyDataForAPI/Widget';

export interface ActivityItem {
  id: number;
  title: string;
  date: string;
  type: string;
  color: string;
}

async function fetchAndStoreData(): Promise<ActivityItem[] | null> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const json = (await response.json()) as { status?: boolean; data?: ActivityItem[] };

    if (json?.status && Array.isArray(json.data)) {
      const data: ActivityItem[] = json.data;
      await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.error('Widget background fetch error:', error);
  }
  return null;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  let activities: ActivityItem[] = [];

  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEY);
    if (cached) {
      activities = JSON.parse(cached) as ActivityItem[];
    }
  } catch (storageError) {
    console.error('Storage Read Error in widget task:', storageError);
  }

  const widgetProps = props as any;

  // Resized dimensions read karna
  const widgetWidth = widgetProps.widgetInfo?.width;
  const widgetHeight = widgetProps.widgetInfo?.height;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (activities.length === 0) {
        const fresh = await fetchAndStoreData();
        if (fresh) activities = fresh;
      }

      // Dynamic height/width widget component ko pass karna
      widgetProps.renderWidget(
        React.createElement(CalendarWidget, {
          activities,
          widgetWidth,
          widgetHeight,
        } as any)
      );
      break;
    }

    case 'WIDGET_CLICK': {
      const clickAction = widgetProps.clickAction;

      if (clickAction === 'RELOAD_API') {
        const freshData = await fetchAndStoreData();
        widgetProps.renderWidget(
          React.createElement(CalendarWidget, {
            activities: freshData ?? activities,
            widgetWidth,
            widgetHeight,
          } as any)
        );
        return;
      }

      if (clickAction === 'CLICK_DATE') {
        const clickedDate = widgetProps.clickActionData?.selectedDate;

        if (clickedDate) {
          try {
            await fetch(`https://dsdev.symstech.com/api/activities?date=${encodeURIComponent(clickedDate)}`, {
              method: 'GET',
              headers: { Accept: 'application/json' },
            });
          } catch (apiError) {
            console.error('Date API error:', apiError);
          }
        }

        widgetProps.renderWidget(
          React.createElement(CalendarWidget, {
            activities,
            widgetWidth,
            widgetHeight,
          } as any)
        );
        return;
      }

      widgetProps.renderWidget(
        React.createElement(CalendarWidget, {
          activities,
          widgetWidth,
          widgetHeight,
        } as any)
      );
      break;
    }

    case 'WIDGET_DELETED':
      break;

    default:
      break;
  }
}