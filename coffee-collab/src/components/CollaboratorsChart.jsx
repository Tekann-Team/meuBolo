// Collaborators balance chart component - Bar Race with images
import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'

const normalizeName = (name = '') => {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s'-])\p{L}/gu, letter => letter.toLocaleUpperCase('pt-BR'))
}

const formatMobileName = (name) => {
  const normalizedName = normalizeName(name)
  const [firstName, secondName] = normalizedName.split(' ')

  return secondName ? `${firstName} ${secondName.charAt(0)}.` : firstName
}

export function CollaboratorsChart({ users }) {
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600)
  const chartHeight = Math.max(400, (users?.length || 0) * 40 + 80)

  useEffect(() => {
    const handleViewportResize = () => setIsMobile(window.innerWidth <= 600)

    window.addEventListener('resize', handleViewportResize)
    return () => window.removeEventListener('resize', handleViewportResize)
  }, [])

  useEffect(() => {
    if (!chartRef.current || !users) return

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)
    }

    const chart = chartInstanceRef.current

    // Include all users with their balance
    const allUsersData = users.map(user => ({
      id: user.id,
      name: isMobile ? formatMobileName(user.name) : normalizeName(user.name),
      photoURL: user.photoURL,
      balance: user.balance || 0
    }))

    // Sort by balance descending
    const sortedData = [...allUsersData].sort((a, b) => b.balance - a.balance)
    const names = sortedData.map(d => d.name)
    const values = sortedData.map(d => d.balance)
    const photoURLs = sortedData.map(d => d.photoURL)

    // Different colors for each bar
    const barColors = [
      '#8B4513',
      '#A0522D',
      '#D2691E',
      '#CD853F',
      '#DEB887',
      '#F4A460',
      '#D2B48C',
      '#BC8F8F',
      '#A08070',
      '#8B7355',
      '#6B4423',
      '#9C661F',
      '#C19A6B',
      '#8B6914',
      '#B8860B'
    ]

    // Chart configuration for bar race
    const option = {
      animationDuration: 1000,
      animationEasing: 'elasticOut',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#8B4513',
        borderWidth: 2,
        textStyle: {
          color: '#333',
          fontSize: 13
        },
        padding: [14, 18],
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 320px; white-space: normal; word-wrap: break-word;',
        formatter: (params) => {
          const param = params[0]
          const name = param.name
          const value = param.value.toFixed(2)
          return [
            '<div style="font-weight: bold; color: #8B4513; font-size: 15px; margin-bottom: 10px;">',
            name,
            '</div>',
            '<div style="margin-bottom: 12px; font-size: 14px;">',
            'Saldo: <span style="font-weight: bold; color: #8B4513;">',
            value,
            ' 🍰</span>',
            '</div>',
            '<div style="font-size: 11px; color: #666; line-height: 18px; padding-top: 10px; border-top: 1px solid #E0E0E0;">',
            'O saldo representa o quanto de bolos cada colaborador ainda tem em contribuições positivas.',
            '<br/><br/>',
            '• Quando alguém compra bolo, o saldo aumenta',
            '<br/>',
            '• Quando uma compensação é feita, todos têm o mesmo valor reduzido',
            '</div>'
          ].join('')
        }
      },
      grid: {
        left: 12,
        right: 100,
        top: 30,
        bottom: 50,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Saldo 🍰',
        axisLabel: {
          formatter: (value) => `${Number(value).toFixed(2)} 🍰`
        },
        max: (value) => Math.max(value.max * 1.35, 1)
      },
      yAxis: {
        type: 'category',
        data: names,
        inverse: true, // Top to bottom
        axisLabel: {
          fontSize: 12,
          margin: 12,
          rich: photoURLs.reduce((acc, photoURL, idx) => {
            // Use data URI or image URL format
            const imageUrl = photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMTQiIGZpbGw9IiNERTZBOUI3Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOEY0NTEzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+4py9PC90ZXh0Pgo8L3N2Zz4='
            acc[`img${idx}`] = {
              height: 28,
              width: 28,
              backgroundColor: {
                image: imageUrl
              },
              borderRadius: 14
            }
            return acc
          }, {}),
          formatter: (value, index) => {
            return `{img${index}|} ${value}`
          }
        }
      },
      series: [
        {
          type: 'bar',
          data: values.map((value, idx) => ({
            value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: barColors[idx % barColors.length] },
                { offset: 1, color: barColors[(idx + 1) % barColors.length] }
              ])
            }
          })),
          label: {
            show: true,
            position: 'right',
            distance: 8,
            formatter: (params) => `${Number(params.value).toFixed(2)} 🍰`,
            fontSize: 12
          },
          name: 'Saldo',
          barWidth: 28,
          animationDelay: (idx) => idx * 50
        }
      ]
    }

    chart.setOption(option)

    // Handle resize
    const handleResize = () => {
      chart.resize()
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartInstanceRef.current = null
    }
  }, [users, isMobile])

  if (!users || users.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        Sem dados disponíveis
      </div>
    )
  }

  return (
    <div className="chart-scroll-container">
      <div
        className="chart-scroll-content"
        ref={chartRef}
        style={{
          width: '100%',
          height: `${chartHeight}px`,
          minHeight: '300px'
        }}
      />
    </div>
  )
}
