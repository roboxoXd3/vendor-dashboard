'use client'
import { useState, useRef, useEffect } from 'react'
import { FaWifi, FaBatteryFull, FaSignal, FaArrowLeft, FaShare, FaSearch } from 'react-icons/fa'
import ProductPreview from './ProductPreview'

export default function MobilePhonePreview({ formData, categories, vendor, className = '' }) {
  const [currentTime, setCurrentTime] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const scrollRef = useRef(null)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Update time every minute and set loaded state
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }))
    }
    
    updateTime()
    setIsLoaded(true) // Mark as loaded after initial setup
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handle scroll position for realistic mobile scrolling
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop
    const scrollHeight = e.target.scrollHeight - e.target.clientHeight
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
    setScrollPosition(scrollPercentage)
  }

  // Don't render until loaded to prevent layout issues
  if (!isLoaded) {
    return (
      <div className={`relative ${className}`} style={{ width: '375px', height: '812px' }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: '375px', height: '812px' }}>
      {/* iPhone 14 Pro Mockup */}
      <div className="relative mx-auto w-full h-full">
        {/* Phone Frame */}
        <div 
          className="absolute inset-0 rounded-[3rem] shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
            padding: '8px'
          }}
        >
          {/* Screen */}
          <div className="relative w-full h-full bg-black rounded-[2.5rem] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-full z-50"></div>
            
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-white z-40 flex items-center justify-between px-6 pt-3">
              <div className="flex items-center space-x-1">
                <span className="text-black font-semibold text-sm">{currentTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaSignal className="text-black text-xs" />
                <FaWifi className="text-black text-xs" />
                <FaBatteryFull className="text-black text-sm" />
              </div>
            </div>

            {/* App Header */}
            <div className="absolute top-12 left-0 right-0 h-14 bg-white z-30 flex items-center justify-between px-4 border-b border-gray-100">
              <div className="flex items-center">
                <button className="p-2 -ml-2">
                  <FaArrowLeft className="text-gray-700 text-lg" />
                </button>
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-gray-900 truncate px-4">
                  {formData.name || 'Product Details'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2">
                  <FaSearch className="text-gray-700 text-lg" />
                </button>
                <button className="p-2 -mr-2">
                  <FaShare className="text-gray-700 text-lg" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div 
              ref={scrollRef}
              className="absolute top-26 left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden bg-white"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
              onScroll={handleScroll}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {/* Product Preview Content */}
              <div className="min-h-full w-full overflow-hidden">
                <div className="w-full max-w-full overflow-hidden">
                  <ProductPreview 
                    formData={formData}
                    categories={categories}
                    vendor={vendor}
                  />
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute right-1 top-32 bottom-4 w-1 bg-gray-200 bg-opacity-30 rounded-full z-40">
              <div 
                className="w-full bg-gray-400 rounded-full transition-all duration-300"
                style={{ 
                  height: '20%',
                  transform: `translateY(${scrollPosition * 4}%)`,
                  minHeight: '20px'
                }}
              />
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Phone Buttons */}
        <div className="absolute left-0 top-24 w-1 h-12 bg-gray-600 rounded-r-sm"></div>
        <div className="absolute left-0 top-40 w-1 h-8 bg-gray-600 rounded-r-sm"></div>
        <div className="absolute left-0 top-52 w-1 h-8 bg-gray-600 rounded-r-sm"></div>
        <div className="absolute right-0 top-32 w-1 h-16 bg-gray-600 rounded-l-sm"></div>
      </div>

      {/* Live Preview Indicator */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Live Preview</span>
        </div>
      </div>

      {/* Device Info */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center z-10">
        <p className="text-xs text-gray-500 font-medium">iPhone 14 Pro</p>
        <p className="text-xs text-gray-400">375 × 812 px</p>
      </div>
    </div>
  )
}

// Enhanced version with multiple device options
export function MultiDevicePreview({ formData, categories, vendor, selectedDevice = 'iphone14pro' }) {
  const devices = {
    iphone14pro: {
      name: 'iPhone 14 Pro',
      width: 375,
      height: 812,
      borderRadius: '3rem',
      screenRadius: '2.5rem'
    },
    pixel7: {
      name: 'Pixel 7',
      width: 360,
      height: 800,
      borderRadius: '2.5rem',
      screenRadius: '2rem'
    },
    galaxys23: {
      name: 'Galaxy S23',
      width: 384,
      height: 854,
      borderRadius: '2.8rem',
      screenRadius: '2.3rem'
    }
  }

  const device = devices[selectedDevice]

  return (
    <div className="relative">
      {/* Device Selector */}
      <div className="mb-6 flex justify-center space-x-2">
        {Object.entries(devices).map(([key, dev]) => (
          <button
            key={key}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedDevice === key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {dev.name}
          </button>
        ))}
      </div>

      {/* Phone Preview */}
      <MobilePhonePreview 
        formData={formData}
        categories={categories}
        vendor={vendor}
      />
    </div>
  )
}
