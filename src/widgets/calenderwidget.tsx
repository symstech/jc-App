"use no memo";

import { FlexWidget, TextWidget } from 'react-native-android-widget';

function getMonthMatrix(year: number, month: number) {
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const matrix: (number | null)[][] = [];
  let currentDay = 1;

  for (let row = 0; row < 6; row++) {
    const week: (number | null)[] = [];
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDayIndex) || currentDay > totalDays) {
        week.push(null);
      } else {
        week.push(currentDay);
        currentDay++;
      }
    }
    matrix.push(week);
    if (currentDay > totalDays) break;
  }
  return matrix;
}

interface CalendarWidgetProps {
  activities?: any[];
  widgetWidth?: number;
  widgetHeight?: number;
}

export function CalendarWidget({ activities = [] }: CalendarWidgetProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthMatrix = getMonthMatrix(currentYear, currentMonth);

  const getDayActivities = (dayNumber: number | null) => {
    if (!dayNumber) return [];
    const formattedDay = String(dayNumber).padStart(2, '0');
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return (activities || []).filter((item) => {
      const actDate = item.date || item.task_date || item.due_date;
      return actDate && actDate.startsWith(dateStr);
    });
  };

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <TextWidget
          text={`${monthNames[currentMonth]} ${currentYear}`}
          style={{
            fontSize: 18,
            fontFamily: 'sans-serif-medium',
            color: '#0f172a',
          }}
        />

        <FlexWidget
          clickAction="RELOAD_API"
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 8,
          }}
        >
          <TextWidget
            text="↻ Reload"
            style={{ fontSize: 14, color: '#ffffff', fontFamily: 'sans-serif-medium' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Weekdays Row */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          height: 24,
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        {weekDays.map((day, idx) => (
          <FlexWidget
            key={idx}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text={day}
              style={{
                fontSize: 13,
                color: idx === 0 || idx === 6 ? '#ef4444' : '#64748b',
                fontFamily: 'sans-serif-medium',
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Calendar Grid: Height increased to 50 per row */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'column',
        }}
      >
        {monthMatrix.map((week, wIdx) => (
          <FlexWidget
            key={wIdx}
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              height: 40, // Pehle 36 tha, ab 50
              alignItems: 'center',
              marginVertical: 2,
            }}
          >
            {week.map((dateVal, dIdx) => {
              const isToday = dateVal === currentDate;
              const dayActs = getDayActivities(dateVal);
              const dayAct = dayActs[0];
              const formattedDay = dateVal ? String(dateVal).padStart(2, '0') : '';
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const fullDateStr = dateVal ? `${currentYear}-${formattedMonth}-${formattedDay}` : '';

              const shortTitle = dayAct?.title ? dayAct.title.split(' ')[0] : '';
              const typeInBracket = dayAct?.type ? `(${dayAct.type.toUpperCase()})` : '';

              return (
                <FlexWidget
                  key={dIdx}
                  clickAction={dateVal ? 'CLICK_DATE' : undefined}
                  clickActionData={dateVal ? { selectedDate: fullDateStr } : undefined}
                  style={{
                    flex: 1,
                    height: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {dateVal !== null ? (
                    <FlexWidget
                      style={{
                        width: 40,
                        height: 34, // Pehle 34 tha, ab 46
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        borderRadius: 8,
                        paddingTop: 2,
                        backgroundColor: isToday ? '#2563eb' : (dayAct ? '#f1f5f9' : '#ffffff'),
                      }}
                    >
                      {/* Date Number */}
                      <TextWidget
                        text={String(dateVal)}
                        style={{
                          fontSize: 14,
                          color: isToday
                            ? '#ffffff'
                            : dIdx === 0 || dIdx === 6
                            ? '#ef4444'
                            : '#0f172a',
                          fontFamily: isToday ? 'sans-serif-medium' : 'sans-serif',
                        }}
                      />

                      {/* Title & (Type) below date */}
                      {dayAct ? (
                        <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginTop: 1 }}>
                          <TextWidget
                            text={shortTitle}
                            style={{
                              fontSize: 10,
                              color: isToday ? '#ffffff' : (dayAct.color || '#2563eb'),
                              fontFamily: 'sans-serif-medium',
                            }}
                          />
                          {/* <TextWidget
                            text={typeInBracket}
                            style={{
                              fontSize: 7,
                              color: isToday ? '#e2e8f0' : '#64748b',
                              fontFamily: 'sans-serif',
                            }}
                          /> */}
                        </FlexWidget>
                      ) : (
                        <FlexWidget style={{ height: 16 }} />
                      )}
                    </FlexWidget>
                  ) : (
                    <FlexWidget style={{ width: 44, height: 46 }} />
                  )}
                </FlexWidget>
              );
            })}
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}