"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Bot, Shuffle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GameRoom {
  id: string
  name: string
  maxPlayers: number
  currentPlayers: number
  aiPlayers: number
  status: "waiting" | "playing" | "full"
}

const mockRooms: GameRoom[] = [
  {
    id: "1",
    name: "초보자 방",
    maxPlayers: 4,
    currentPlayers: 2,
    aiPlayers: 1,
    status: "waiting",
  },
  {
    id: "2",
    name: "중급자 방",
    maxPlayers: 6,
    currentPlayers: 4,
    aiPlayers: 2,
    status: "playing",
  },
  {
    id: "3",
    name: "고수 방",
    maxPlayers: 8,
    currentPlayers: 6,
    aiPlayers: 1,
    status: "playing",
  },
  {
    id: "4",
    name: "빠른 게임",
    maxPlayers: 4,
    currentPlayers: 3,
    aiPlayers: 0,
    status: "waiting",
  },
  {
    id: "5",
    name: "토너먼트",
    maxPlayers: 8,
    currentPlayers: 8,
    aiPlayers: 2,
    status: "full",
  },
]

export default function HomePage() {
  const [rooms] = useState<GameRoom[]>(mockRooms)
  const router = useRouter()
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: "",
    maxPlayers: 4,
    password: "",
  })

  const handleJoinRoom = (roomId: string) => {
    // 새 창으로 게임룸 열기
    const gameWindow = window.open(
      `/room/${roomId}`,
      "poker-game",
      "width=1400,height=900,resizable=no,scrollbars=no,menubar=no,toolbar=no,location=no,status=no",
    )

    if (gameWindow) {
      gameWindow.focus()
    }
  }

  const handleRandomJoin = () => {
    const availableRooms = rooms.filter((room) => room.status !== "full" && room.currentPlayers < room.maxPlayers)
    if (availableRooms.length > 0) {
      const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)]
      // 새 창으로 게임룸 열기
      const gameWindow = window.open(
        `/room/${randomRoom.id}`,
        "poker-game",
        "width=1400,height=900,resizable=no,scrollbars=no,menubar=no,toolbar=no,location=no,status=no",
      )

      if (gameWindow) {
        gameWindow.focus()
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-green-500"
      case "playing":
        return "bg-yellow-500"
      case "full":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "대기중"
      case "playing":
        return "게임중"
      case "full":
        return "만석"
      default:
        return "알 수 없음"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
              Seven Poker
              <span className="text-emerald-400">.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              프리미엄 온라인 포커 경험을 즐겨보세요. 전 세계 플레이어들과 실시간으로 대결하세요.
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-12">
              <Button
                onClick={handleRandomJoin}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                빠른 시작
              </Button>

              <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />방 만들기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 게임룸 만들기</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomName">방 이름</Label>
                      <Input
                        id="roomName"
                        value={newRoom.name}
                        onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                        placeholder="방 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxPlayers">최대 인원</Label>
                      <Select
                        value={newRoom.maxPlayers.toString()}
                        onValueChange={(value) => setNewRoom({ ...newRoom, maxPlayers: Number.parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2명</SelectItem>
                          <SelectItem value="4">4명</SelectItem>
                          <SelectItem value="6">6명</SelectItem>
                          <SelectItem value="8">8명</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="password">비밀번호 (선택사항)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newRoom.password}
                        onChange={(e) => setNewRoom({ ...newRoom, password: e.target.value })}
                        placeholder="비밀번호를 입력하세요"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        // 방 생성 로직
                        console.log("Creating room:", newRoom)
                        const newRoomId = Date.now().toString() // 임시 ID 생성

                        // 새 창으로 게임룸 열기
                        const gameWindow = window.open(
                          `/room/${newRoomId}`,
                          "poker-game",
                          "width=1400,height=900,resizable=no,scrollbars=no,menubar=no,toolbar=no,location=no,status=no",
                        )

                        if (gameWindow) {
                          gameWindow.focus()
                        }

                        setIsCreateRoomOpen(false)
                      }}
                      className="w-full"
                    >
                      방 만들기
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Game Rooms Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">활성 게임룸</h2>
          <p className="text-slate-400">참여 가능한 게임룸을 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white text-xl font-semibold">{room.name}</CardTitle>
                  <Badge className={`${getStatusColor(room.status)} text-white border-0 px-3 py-1`}>
                    {getStatusText(room.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">플레이어</span>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {room.currentPlayers}/{room.maxPlayers}
                    </span>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
                      <Bot className="h-4 w-4" />
                      <span className="text-sm">AI</span>
                    </div>
                    <span className="text-white font-bold text-lg">{room.aiPlayers}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>참여율</span>
                    <span>{Math.round((room.currentPlayers / room.maxPlayers) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(room.currentPlayers / room.maxPlayers) * 100}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.status === "full"}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  {room.status === "full" ? "만석" : "게임 참여"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <p className="text-slate-300 text-sm leading-relaxed">
              💡 <strong>게임 팁:</strong> 현재 진행중인 라운드가 종료되면 AI 플레이어가 실제 플레이어로 자동
              대체됩니다.
              <br />
              최고의 포커 경험을 위해 안정적인 인터넷 연결을 권장합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
