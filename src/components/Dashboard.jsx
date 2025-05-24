import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import { backtestApi, strategyApi, userApi } from '../services/api'
import { Button } from './ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui'
import { Badge } from './ui'
import { Alert, AlertDescription } from './ui'
import { cn, formatCurrency, formatPercentage, formatDate, getStatusColor } from '../lib/utils'
import {
  TrendingUp, BarChart3, Settings, Plus, Moon, Sun, Laptop,
  LogOut, User, Activity, DollarSign, TrendingDown, Clock,
  Play, Pause, RefreshCw, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'
import CreateBacktestModal from './CreateBacktestModal'
import CreateStrategyModal from './CreateStrategyModal'
import BacktestDetailsModal from './BacktestDetailsModal'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [backtests, setBacktests] = useState([])
  const [strategies, setStrategies] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateBacktest, setShowCreateBacktest] = useState(false)
  const [showCreateStrategy, setShowCreateStrategy] = useState(false)
  const [selectedBacktest, setSelectedBacktest] = useState(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [backtestsData, strategiesData, userData] = await Promise.all([
        backtestApi.getAll(),
        strategyApi.getAll(),
        userApi.getCurrentUser()
      ])
      setBacktests(backtestsData)
      setStrategies(strategiesData)
      setUser(userData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const ThemeToggle = () => {
    const themes = [
      { value: 'light', icon: Sun },
      { value: 'dark', icon: Moon },
      { value: 'system', icon: Laptop },
    ]

    return (
      <div className="flex items-center rounded-lg border">
        {themes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              theme === value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    )
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <span className={cn(
                  'flex items-center text-sm font-medium',
                  trend === 'up' ? 'text-success' : 'text-destructive'
                )}>
                  {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {change}
                </span>
              )}
            </div>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  const getStats = () => {
    const completedBacktests = backtests.filter(b => b.status === 'completed')
    const totalReturns = completedBacktests.reduce((sum, b) => sum + (b.total_return || 0), 0)
    const avgReturn = completedBacktests.length > 0 ? totalReturns / completedBacktests.length : 0
    const winningBacktests = completedBacktests.filter(b => (b.total_return || 0) > 0).length
    const winRate = completedBacktests.length > 0 ? winningBacktests / completedBacktests.length : 0

    return {
      totalBacktests: backtests.length,
      avgReturn,
      winRate,
      totalStrategies: strategies.length
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">BacktestPro</h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r bg-card p-6">
          <div className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'backtests', label: 'Backtests', icon: Activity },
              { id: 'strategies', label: 'Strategies', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  activeTab === id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {user && (
            <div className="mt-8 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Premium User</p>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                  Overview of your backtesting performance and strategies.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Backtests"
                  value={stats.totalBacktests}
                  icon={Activity}
                />
                <StatCard
                  title="Average Return"
                  value={formatPercentage(stats.avgReturn)}
                  change="12.5%"
                  trend={stats.avgReturn > 0 ? 'up' : 'down'}
                  icon={DollarSign}
                />
                <StatCard
                  title="Win Rate"
                  value={formatPercentage(stats.winRate)}
                  change="5.2%"
                  trend="up"
                  icon={TrendingUp}
                />
                <StatCard
                  title="Strategies"
                  value={stats.totalStrategies}
                  icon={Settings}
                />
              </div>

              {/* Recent Backtests */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Backtests</CardTitle>
                  <CardDescription>
                    Your latest backtesting runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {backtests.slice(0, 5).map((backtest) => (
                      <div
                        key={backtest.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedBacktest(backtest)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn('p-2 rounded-lg', getStatusColor(backtest.status))}>
                            {backtest.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                            {backtest.status === 'running' && <Play className="h-4 w-4" />}
                            {backtest.status === 'failed' && <XCircle className="h-4 w-4" />}
                            {backtest.status === 'pending' && <Clock className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{backtest.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {backtest.symbol} • {formatDate(backtest.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {backtest.total_return ? formatPercentage(backtest.total_return) : '--'}
                          </p>
                          <Badge variant="outline" className={getStatusColor(backtest.status)}>
                            {backtest.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {backtests.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No backtests yet. Create your first backtest to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'backtests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Backtests</h2>
                  <p className="text-muted-foreground">
                    Manage and analyze your backtesting runs.
                  </p>
                </div>
                <Button onClick={() => setShowCreateBacktest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Backtest
                </Button>
              </div>

              <div className="grid gap-4">
                {backtests.map((backtest) => (
                  <Card key={backtest.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedBacktest(backtest)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn('p-3 rounded-lg', getStatusColor(backtest.status))}>
                            {backtest.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                            {backtest.status === 'running' && <RefreshCw className="h-5 w-5 animate-spin" />}
                            {backtest.status === 'failed' && <XCircle className="h-5 w-5" />}
                            {backtest.status === 'pending' && <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{backtest.name}</h3>
                            <p className="text-muted-foreground">
                              {backtest.strategy} • {backtest.symbol}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(backtest.start_date)} - {formatDate(backtest.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Return</p>
                              <p className={cn(
                                'font-bold text-lg',
                                (backtest.total_return || 0) >= 0 ? 'text-success' : 'text-destructive'
                              )}>
                                {backtest.total_return ? formatPercentage(backtest.total_return) : '--'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Sharpe</p>
                              <p className="font-medium">
                                {backtest.sharpe_ratio ? backtest.sharpe_ratio.toFixed(2) : '--'}
                              </p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(backtest.status)}>
                              {backtest.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {backtests.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No backtests yet</h3>
                      <p className="text-muted-foreground text-center mb-6">
                        Start by creating your first backtest to analyze your trading strategies.
                      </p>
                      <Button onClick={() => setShowCreateBacktest(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Backtest
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Strategies</h2>
                  <p className="text-muted-foreground">
                    Manage your trading strategies and templates.
                  </p>
                </div>
                <Button onClick={() => setShowCreateStrategy(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Strategy
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {strategies.map((strategy) => (
                  <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        {strategy.is_public && (
                          <Badge variant="secondary">Public</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {strategy.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Created {formatDate(strategy.created_at)}
                        </p>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {strategies.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Settings className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
                      <p className="text-muted-foreground text-center mb-6">
                        Create your first trading strategy to start backtesting.
                      </p>
                      <Button onClick={() => setShowCreateStrategy(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Strategy
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateBacktestModal
        open={showCreateBacktest}
        onOpenChange={setShowCreateBacktest}
        strategies={strategies}
        onSuccess={() => {
          setShowCreateBacktest(false)
          loadData()
        }}
      />

      <CreateStrategyModal
        open={showCreateStrategy}
        onOpenChange={setShowCreateStrategy}
        onSuccess={() => {
          setShowCreateStrategy(false)
          loadData()
        }}
      />

      <BacktestDetailsModal
        backtest={selectedBacktest}
        open={!!selectedBacktest}
        onOpenChange={() => setSelectedBacktest(null)}
        onUpdate={loadData}
      />
    </div>
  )
}