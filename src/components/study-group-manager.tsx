'use client'

import React, { useState, KeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditIcon, CheckIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"

type Topic = {
  id: number
  title: string
}

type Presenter = {
  id: number
  name: string
  presentationCount: number
  presentedTopics: Topic[]
  excluded: boolean
}

type ListType = 'topics' | 'presentedTopics' | 'excludedTopics'

export function StudyGroupManager() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [presentedTopics, setPresentedTopics] = useState<Topic[]>([])
  const [excludedTopics, setExcludedTopics] = useState<Topic[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [presenters, setPresenters] = useState<Presenter[]>([
    { id: 1, name: '山田', presentationCount: 2, presentedTopics: [], excluded: false },
    { id: 2, name: '鈴木', presentationCount: 1, presentedTopics: [], excluded: false },
    { id: 3, name: '佐藤', presentationCount: 3, presentedTopics: [], excluded: false },
  ])
  const [nextPresenter, setNextPresenter] = useState<Presenter | null>(null)
  const [nextTopic, setNextTopic] = useState<Topic | null>(null)
  const [editingPresenter, setEditingPresenter] = useState<Presenter | null>(null)
  const [isConfirmingPresentation, setIsConfirmingPresentation] = useState(false)
  const [newPresenterName, setNewPresenterName] = useState('')
  const [isAddPresenterDialogOpen, setIsAddPresenterDialogOpen] = useState(false)
  const [expandedPresenters] = useState<number[]>([])
  const [editingPresentedTopic, setEditingPresentedTopic] = useState<{ presenterId: number, topicId: number } | null>(null)
  const [isPresenterListExpanded, setIsPresenterListExpanded] = useState(true)

  const addTopic = () => {
    if (newTopic.trim() !== '') {
      setTopics([...topics, { id: Date.now(), title: newTopic }])
      setNewTopic('')
    }
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addTopic()
    }
  }

  const startEditingTopic = (topic: Topic) => {
    setEditingTopic(topic)
  }

  const saveEditedTopic = (listType: ListType) => {
    if (editingTopic) {
      const updateList = (list: Topic[]) =>
        list.map(t => (t.id === editingTopic.id ? editingTopic : t))

      switch (listType) {
        case 'topics':
          setTopics(updateList(topics))
          break
        case 'presentedTopics':
          setPresentedTopics(updateList(presentedTopics))
          break
        case 'excludedTopics':
          setExcludedTopics(updateList(excludedTopics))
          break
      }
      setEditingTopic(null)
    }
  }

  const decidePresentationDetails = () => {
    if (topics.length === 0 || presenters.length === 0) return

    const availablePresenters = presenters.filter(p => !p.excluded)
    if (availablePresenters.length === 0) {
      alert('利用可能な発表者がいません。発表者の除外を解除してください。')
      return
    }

    const sortedPresenters = [...availablePresenters].sort((a, b) => a.presentationCount - b.presentationCount)
    const suggestedPresenter = sortedPresenters[0]
    const availableTopics = topics.filter(topic => 
      !presentedTopics.some(pt => pt.id === topic.id) && 
      !excludedTopics.some(et => et.id === topic.id)
    )
    
    if (availableTopics.length === 0) {
      alert('利用可能なネタがありません。新しいネタを追加するか、除外されたネタを戻してください。')
      return
    }

    const suggestedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)]

    setNextPresenter(suggestedPresenter)
    setNextTopic(suggestedTopic)
    setIsConfirmingPresentation(true)
  }

  const confirmPresentation = () => {
    if (nextPresenter && nextTopic) {
      setPresenters(presenters.map(p => 
        p.id === nextPresenter.id 
          ? { 
              ...p, 
              presentationCount: p.presentationCount + 1,
              presentedTopics: [...p.presentedTopics, nextTopic]
            } 
          : p
      ))
      setPresentedTopics([...presentedTopics, nextTopic])
      setTopics(topics.filter(t => t.id !== nextTopic.id))
    }
    setIsConfirmingPresentation(false)
    setNextPresenter(null)
    setNextTopic(null)
  }

  const cancelPresentation = () => {
    setIsConfirmingPresentation(false)
    setNextPresenter(null)
    setNextTopic(null)
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return

    const sourceList = source.droppableId as ListType
    const destList = destination.droppableId as ListType

    const getList = (id: ListType): Topic[] => {
      switch (id) {
        case 'topics': return topics
        case 'presentedTopics': return presentedTopics
        case 'excludedTopics': return excludedTopics
        default: return []
      }
    }

    const setList = (id: ListType, newList: Topic[]) => {
      switch (id) {
        case 'topics': setTopics(newList); break
        case 'presentedTopics': setPresentedTopics(newList); break
        case 'excludedTopics': setExcludedTopics(newList); break
      }
    }

    const sourceClone = Array.from(getList(sourceList))
    const destClone = Array.from(getList(destList))
    const [removed] = sourceClone.splice(source.index, 1)

    if (sourceList === destList) {
      sourceClone.splice(destination.index, 0, removed)
      setList(sourceList, sourceClone)
    } else {
      destClone.splice(destination.index, 0, removed)
      setList(sourceList, sourceClone)
      setList(destList, destClone)
    }
  }

  const startEditingPresenter = (presenter: Presenter) => {
    setEditingPresenter(presenter)
  }

  const saveEditedPresenter = () => {
    if (editingPresenter) {
      setPresenters(presenters.map(p => 
        p.id === editingPresenter.id ? editingPresenter : p
      ))
      setEditingPresenter(null)
    }
  }

  const addPresenter = () => {
    if (newPresenterName.trim() !== '') {
      const newPresenter: Presenter = {
        id: Date.now(),
        name: newPresenterName,
        presentationCount: 0,
        presentedTopics: [],
        excluded: false
      }
      setPresenters([...presenters, newPresenter])
      setNewPresenterName('')
      setIsAddPresenterDialogOpen(false)
    }
  }

  const startEditingPresentedTopic = (presenterId: number, topicId: number) => {
    setEditingPresentedTopic({ presenterId, topicId })
  }

  const savePresentedTopic = (presenterId: number, topicId: number, newTitle: string) => {
    setPresenters(presenters.map(p => 
      p.id === presenterId
        ? {
            ...p,
            presentedTopics: p.presentedTopics.map(t => 
              t.id === topicId ? { ...t, title: newTitle } : t
            )
          }
        : p
    ))
    setEditingPresentedTopic(null)
  }

  const togglePresenterExclusion = (presenterId: number) => {
    setPresenters(presenters.map(p => 
      p.id === presenterId ? { ...p, excluded: !p.excluded } : p
    ))
  }

  const renderTopicList = (title: string, topicList: Topic[], listType: ListType) => (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={listType}>
          {(provided) => (
            <ul className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
              {topicList.map((topic, index) => (
                <Draggable key={topic.id} draggableId={topic.id.toString()} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex justify-between items-center bg-secondary p-2 rounded"
                    >
                      {editingTopic && editingTopic.id === topic.id ? (
                        <Input
                          value={editingTopic.title}
                          onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                          onBlur={() => saveEditedTopic(listType)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEditedTopic(listType)}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm">{topic.title}</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => startEditingTopic(topic)}>
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </CardContent>
    </Card>
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>勉強会ネタ管理アプリ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="新しいネタを追加"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={addTopic}>追加</Button>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {renderTopicList("ネタ一覧", topics, 'topics')}
                {renderTopicList("発表済み一覧", presentedTopics, 'presentedTopics')}
                {renderTopicList("除外一覧", excludedTopics, 'excludedTopics')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible
          open={isPresenterListExpanded}
          onOpenChange={setIsPresenterListExpanded}
        >
          <Card>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <CardTitle className="flex justify-between items-center cursor-pointer">
                  発表者一覧
                  <Button variant="ghost" size="sm">
                    {isPresenterListExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Dialog open={isAddPresenterDialogOpen} onOpenChange={setIsAddPresenterDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        発表者を追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しい発表者を追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-presenter-name">名前</Label>
                          <Input
                            id="new-presenter-name"
                            value={newPresenterName}
                            onChange={(e) => setNewPresenterName(e.target.value)}
                          />
                        </div>
                        <Button onClick={addPresenter}>追加</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <ul className="space-y-4">
                  {presenters.map((presenter) => (
                    <li key={presenter.id} className="space-y-2">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-between items-center cursor-pointer">
                            <span>{presenter.name}</span>
                            <div className="flex items-center space-x-2">
                              {editingPresenter && editingPresenter.id === presenter.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    value={editingPresenter.presentationCount}
                                    onChange={(e) => setEditingPresenter({ ...editingPresenter, presentationCount: parseInt(e.target.value) || 0 })}
                                    className="w-16"
                                  />
                                  <Button size="sm" onClick={saveEditedPresenter}>
                                    <CheckIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="cursor-pointer" onClick={() => startEditingPresenter(presenter)}>
                                  発表回数: {presenter.presentationCount}
                                </Badge>
                              )}
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">除外</span>
                                <Switch
                                  checked={presenter.excluded}
                                  onCheckedChange={() => togglePresenterExclusion(presenter.id)}
                                />
                              </div>
                              {expandedPresenters.includes(presenter.id) ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="pl-4 mt-2 space-y-1">
                            {presenter.presentedTopics.map((topic) => (
                              <li key={topic.id} className="flex items-center justify-between">
                                {editingPresentedTopic && editingPresentedTopic.presenterId === presenter.id && editingPresentedTopic.topicId === topic.id ? (
                                  <Input
                                    value={topic.title}
                                    onChange={(e) => {
                                      const newTitle = e.target.value
                                      setPresenters(presenters.map(p => 
                                        p.id === presenter.id
                                          ? {
                                              ...p,
                                              presentedTopics: p.presentedTopics.map(t => 
                                                t.id === topic.id ? { ...t, title: newTitle } : t
                                              )
                                            }
                                          : p
                                      ))
                                    }}
                                    onBlur={() => savePresentedTopic(presenter.id, topic.id, topic.title)}
                                    onKeyPress={(e) => e.key === 'Enter' && savePresentedTopic(presenter.id, topic.id, topic.title)}
                                    className="text-sm"
                                  />
                                ) : (
                                  <>
                                    <span className="text-sm">{topic.title}</span>
                                    <Button size="sm" variant="ghost" onClick={() => startEditingPresentedTopic(presenter.id, topic.id)}>
                                      <EditIcon className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card>
          <CardHeader>
            <CardTitle>次回の発表</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={decidePresentationDetails}>次回の発表者とネタを決める</Button>
            {isConfirmingPresentation && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="presenter-select" className="block text-sm font-medium text-gray-700">
                    発表者を選択:
                  </label>
                  <Select
                    value={nextPresenter?.id.toString()}
                    onValueChange={(value) => setNextPresenter(presenters.find(p => p.id.toString() === value) || null)}
                  >
                    <SelectTrigger id="presenter-select">
                      <SelectValue placeholder="発表者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {presenters.filter(p => !p.excluded).map((presenter) => (
                        <SelectItem key={presenter.id} value={presenter.id.toString()}>
                          {presenter.name} (発表回数: {presenter.presentationCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="topic-select" className="block text-sm font-medium text-gray-700">
                    発表ネタを選択:
                  </label>
                  <Select
                    value={nextTopic?.id.toString()}
                    onValueChange={(value) => setNextTopic(topics.find(t => t.id.toString() === value) || null)}
                  >
                    <SelectTrigger id="topic-select">
                      <SelectValue placeholder="発表ネタを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-x-2">
                  <Button onClick={confirmPresentation}>承認</Button>
                  <Button variant="outline" onClick={cancelPresentation}>キャンセル</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  )
}
