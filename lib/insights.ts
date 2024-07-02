export function getActions(actions: any[] | null) {
  if (actions === null) {
    return {}
  }

  const result = actions.reduce((acc, action) => {
    acc[action.action_type] = action.value
    return acc
  }, {})

  return result
}

export function getCPA(costs: any[] | null) {
  if (costs === null) {
    return {}
  }

  const result = costs.reduce((acc, cost) => {
    if (cost.action_type === 'purchase') {
      acc[cost.action_type] = cost.value
    }
    return acc
  }, {})

  return result
}

export function getPercentage(first: string, second: string) {
  let f, s
  if (first && second) {
    f = parseInt(first)
    s = parseInt(second)

    return `${((f / s) * 100).toPrecision(4)}%`
  } else {
    return ''
  }
}

export function getHookRate(hooks: string, plays: string) {
  let totalPlays, totalHooks
  if (hooks && plays) {
    totalPlays = parseInt(plays)
    totalHooks = parseInt(hooks)

    const hookRate = `${((totalHooks / totalPlays) * 100).toPrecision(4)}%`
    return hookRate
  } else {
    return ''
  }
}

export function getBounceRate(views: string, LC: string) {
  let v, lc
  if (views && LC) {
    v = parseInt(views)
    lc = parseInt(LC)
    const bounceRate = `${(100 * (1 - v / lc)).toPrecision(4)}%`
    return bounceRate
  } else {
    return ''
  }
}
