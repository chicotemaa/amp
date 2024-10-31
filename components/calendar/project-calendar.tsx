"use client";

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { format, startOfToday, parse, getDay, eachDayOfInterval, endOfMonth, startOfMonth, isToday, isSameMonth, isEqual, add, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const meetings = [
  {
    id: 1,
    name: 'Inicio de Obra - Torre Marina',
    startDatetime: '2024-03-15T13:00',
    endDatetime: '2024-03-15T14:30',
    type: 'start',
  },
  {
    id: 2,
    name: 'Revisión de Avance - Centro Comercial',
    startDatetime: '2024-03-20T09:00',
    endDatetime: '2024-03-20T11:00',
    type: 'review',
  },
  {
    id: 3,
    name: 'Entrega de Fase 1 - Complejo Deportivo',
    startDatetime: '2024-03-25T14:00',
    endDatetime: '2024-03-25T15:00',
    type: 'milestone',
  },
  {
    id: 4,
    name: 'Reunión con Contratistas - Hospital',
    startDatetime: '2024-03-28T10:00',
    endDatetime: '2024-03-28T11:30',
    type: 'meeting',
  },
];

export function ProjectCalendar() {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(firstDayCurrentMonth),
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  const selectedDayMeetings = meetings.filter((meeting) =>
    isEqual(parseISO(meeting.startDatetime), selectedDay)
  );

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          <time dateTime={format(firstDayCurrentMonth, 'yyyy-MM')}>
            {format(firstDayCurrentMonth, 'MMMM yyyy', { locale: es })}
          </time>
        </h1>
        <div className="flex items-center">
          <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
              onClick={previousMonth}
            >
              <span className="sr-only">Mes anterior</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
              onClick={() => setSelectedDay(today)}
            >
              Hoy
            </button>
            <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
              onClick={nextMonth}
            >
              <span className="sr-only">Próximo mes</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <div className="shadow ring-1 ring-black ring-opacity-5 lg:flex lg:flex-auto lg:flex-col">
        <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 lg:flex-none">
          <div className="bg-white py-2">
            Lun<span className="sr-only sm:not-sr-only">es</span>
          </div>
          <div className="bg-white py-2">
            Mar<span className="sr-only sm:not-sr-only">tes</span>
          </div>
          <div className="bg-white py-2">
            Mié<span className="sr-only sm:not-sr-only">rcoles</span>
          </div>
          <div className="bg-white py-2">
            Jue<span className="sr-only sm:not-sr-only">ves</span>
          </div>
          <div className="bg-white py-2">
            Vie<span className="sr-only sm:not-sr-only">rnes</span>
          </div>
          <div className="bg-white py-2">
            Sáb<span className="sr-only sm:not-sr-only">ado</span>
          </div>
          <div className="bg-white py-2">
            Dom<span className="sr-only sm:not-sr-only">ingo</span>
          </div>
        </div>
        <div className="flex bg-gray-200 text-xs leading-6 text-gray-700 lg:flex-auto">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
            {days.map((day, dayIdx) => {
              const dayMeetings = meetings.filter(
                meeting =>
                  format(parseISO(meeting.startDatetime), 'yyyy-MM-dd') ===
                  format(day, 'yyyy-MM-dd')
              );

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    'relative bg-white py-2 px-3'
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full',
                      isEqual(day, selectedDay) && 'font-semibold',
                      isToday(day) && 'bg-primary text-white',
                      !isToday(day) &&
                        isEqual(day, selectedDay) &&
                        'bg-gray-900 text-white',
                      !isToday(day) &&
                        !isEqual(day, selectedDay) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        'text-gray-900',
                      !isToday(day) &&
                        !isEqual(day, selectedDay) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        'text-gray-400',
                      dayMeetings.length > 0 &&
                        !isToday(day) &&
                        !isEqual(day, selectedDay) &&
                        'font-semibold'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  {dayMeetings.length > 0 && (
                    <ol className="mt-2">
                      {dayMeetings.slice(0, 2).map((meeting) => (
                        <li key={meeting.id}>
                          <a href="#" className="group flex">
                            <p
                              className={cn(
                                'flex-auto truncate font-medium text-xs',
                                meeting.type === 'start' && 'text-success',
                                meeting.type === 'review' && 'text-warning',
                                meeting.type === 'milestone' && 'text-primary',
                                meeting.type === 'meeting' && 'text-info'
                              )}
                            >
                              {meeting.name}
                            </p>
                            <time
                              dateTime={meeting.startDatetime}
                              className="ml-3 hidden flex-none text-gray-500 group-hover:block"
                            >
                              {format(parseISO(meeting.startDatetime), 'HH:mm')}
                            </time>
                          </a>
                        </li>
                      ))}
                      {dayMeetings.length > 2 && (
                        <li className="text-gray-500">
                          + {dayMeetings.length - 2} más
                        </li>
                      )}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedDayMeetings.length > 0 && (
        <div className="py-4 px-6">
          <h2 className="text-base font-semibold leading-6 text-gray-900">
            Eventos para{' '}
            <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
              {format(selectedDay, 'MMM dd, yyy', { locale: es })}
            </time>
          </h2>
          <ol className="mt-4 space-y-1 text-sm leading-6">
            {selectedDayMeetings.map((meeting) => (
              <li
                key={meeting.id}
                className="group flex items-center space-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100"
              >
                <div className="flex-auto">
                  <p className="font-semibold text-gray-900">{meeting.name}</p>
                  <p className="mt-0.5">
                    <time dateTime={meeting.startDatetime}>
                      {format(parseISO(meeting.startDatetime), 'HH:mm')}
                    </time>{' '}
                    -{' '}
                    <time dateTime={meeting.endDatetime}>
                      {format(parseISO(meeting.endDatetime), 'HH:mm')}
                    </time>
                  </p>
                </div>
                <Menu
                  as="div"
                  className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                >
                  <div>
                    <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                      <span className="sr-only">Abrir opciones</span>
                      <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="#"
                              className={cn(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm'
                              )}
                            >
                              Editar
                            </a>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="#"
                              className={cn(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm'
                              )}
                            >
                              Cancelar
                            </a>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const colStartClasses = [
  '',
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];