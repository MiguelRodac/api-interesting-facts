import { compareVersions } from '@shared/domain/utils/compareVersions'

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(compareVersions('2.5.3', '2.5.3')).toBe(0)
  })

  it('should return -1 when a < b', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1)
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1)
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1)
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1)
  })

  it('should return 1 when a > b', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1)
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1)
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1)
  })

  it('should handle missing patch segment', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0)
    expect(compareVersions('1.2', '1.2.1')).toBe(-1)
    expect(compareVersions('1.3', '1.2.9')).toBe(1)
  })

  it('should handle single segment', () => {
    expect(compareVersions('2', '1')).toBe(1)
    expect(compareVersions('1', '2')).toBe(-1)
    expect(compareVersions('1', '1')).toBe(0)
  })
})
