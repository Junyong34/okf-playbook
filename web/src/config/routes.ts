// 라우트 경로와 좌측 메뉴 항목. 스펙: .scratch/okf-web-ui/spec.md "화면과 라우트"
import type { IconType } from '@astryxdesign/core/Icon';
import { BugAntIcon, ChatBubbleLeftRightIcon, ShareIcon } from '@heroicons/react/24/outline';
import {
  BugAntIcon as BugAntSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  ShareIcon as ShareSolidIcon,
} from '@heroicons/react/24/solid';

export const ROUTES = {
  chat: '/chat',
  debug: '/debug',
  graph: '/graph',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export type NavItem = {
  path: RoutePath;
  label: string;
  description: string;
  icon: IconType;
  selectedIcon: IconType;
  isReady: boolean; // false면 메뉴에 "준비 중"으로 비활성화
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    path: ROUTES.chat,
    label: '상담 화면',
    description: '고객에게 보이는 질문과 답변',
    icon: ChatBubbleLeftRightIcon,
    selectedIcon: ChatBubbleLeftRightSolidIcon,
    isReady: true,
  },
  {
    path: ROUTES.debug,
    label: '디버깅 화면',
    description: '요청 조립 기록과 인용 검사',
    icon: BugAntIcon,
    selectedIcon: BugAntSolidIcon,
    isReady: true,
  },
  {
    path: ROUTES.graph,
    label: '그래프 화면',
    description: '개념·링크·출처 그래프',
    icon: ShareIcon,
    selectedIcon: ShareSolidIcon,
    isReady: true,
  },
];
