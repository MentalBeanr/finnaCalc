export {}

interface TradingViewWidgetConfig {
    autosize?: boolean
    symbol?: string
    interval?: string
    timezone?: string
    theme?: "light" | "dark"
    style?: string
    locale?: string
    toolbar_bg?: string
    enable_publishing?: boolean
    allow_symbol_change?: boolean
    container_id?: string
}

interface TradingViewWidgetConstructor {
    new (config: TradingViewWidgetConfig): unknown
}

interface TradingViewGlobal {
    widget: TradingViewWidgetConstructor
}

declare global {
    interface Window {
        TradingView?: TradingViewGlobal
    }
}
